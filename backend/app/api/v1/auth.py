from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.deps import get_db, get_current_user
from app.schemas.auth import (
    UserCreate, UserLogin, Token, RefreshToken, UserResponse,
    UserPasswordUpdate, MfaSetupResponse, MfaVerifyRequest, MfaLoginRequest
)
from app.models.user import User
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from jose import jwt, JWTError
import pyotp
import urllib.parse
from app.config import settings
from app.core.rate_limiter import limiter
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from fastapi.responses import RedirectResponse

starlette_config = Config(environ={
    "GOOGLE_CLIENT_ID": settings.google_client_id or "",
    "GOOGLE_CLIENT_SECRET": settings.google_client_secret or "",
    "GITHUB_CLIENT_ID": settings.github_client_id or "",
    "GITHUB_CLIENT_SECRET": settings.github_client_secret or "",
})
oauth = OAuth(starlette_config)

oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

oauth.register(
    name='github',
    access_token_url='https://github.com/login/oauth/access_token',
    access_token_params=None,
    authorize_url='https://github.com/login/oauth/authorize',
    authorize_params=None,
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'},
)

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(request: Request, user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        name=user_in.name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not user.hashed_password or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if user.mfa_enabled:
        temp_token = jwt.encode({"sub": str(user.id), "type": "mfa_temp"}, settings.secret_key, algorithm=settings.algorithm)
        return {"mfa_required": True, "temp_token": temp_token, "token_type": "bearer"}
    
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer"
    }

@router.post("/login/mfa", response_model=Token)
@limiter.limit("10/minute")
def login_mfa(request: Request, mfa_in: MfaLoginRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(mfa_in.temp_token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
        if payload.get("type") != "mfa_temp" or not user_id:
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.mfa_enabled or not user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA not enabled for user")

    totp = pyotp.TOTP(user.mfa_secret)
    if not totp.verify(mfa_in.code):
        raise HTTPException(status_code=400, detail="Invalid MFA code")

    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
@limiter.limit("10/minute")
def refresh(request: Request, token_in: RefreshToken, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token_in.refresh_token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer"
    }

@router.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.delete("/users/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_users_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.delete(current_user)
    db.commit()
    return None

@router.patch("/users/me/password", status_code=status.HTTP_200_OK)
def update_password(payload: UserPasswordUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.hashed_password and not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"detail": "Password updated successfully"}

@router.post("/mfa/setup", response_model=MfaSetupResponse)
def setup_mfa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    secret = pyotp.random_base32()
    current_user.mfa_secret = secret
    db.commit()

    provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name="Ember"
    )
    return {"secret": secret, "qr_code_uri": provisioning_uri}

@router.post("/mfa/verify", status_code=status.HTTP_200_OK)
def verify_mfa(payload: MfaVerifyRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA setup not initiated")
    
    totp = pyotp.TOTP(current_user.mfa_secret)
    if not totp.verify(payload.code):
        raise HTTPException(status_code=400, detail="Invalid MFA code")
        
    current_user.mfa_enabled = True
    db.commit()
    return {"detail": "MFA enabled successfully"}

@router.delete("/mfa/disable", status_code=status.HTTP_200_OK)
def disable_mfa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    db.commit()
    return {"detail": "MFA disabled successfully"}

@router.get("/{provider}/login")
async def oauth_login(provider: str, request: Request):
    if provider not in ["google", "github"]:
        raise HTTPException(status_code=400, detail="Invalid provider")
    
    redirect_uri = f"{request.base_url}api/v1/auth/{provider}/callback"
    client = oauth.create_client(provider)
    return await client.authorize_redirect(request, redirect_uri)

@router.get("/{provider}/callback")
async def oauth_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    if provider not in ["google", "github"]:
        raise HTTPException(status_code=400, detail="Invalid provider")

    client = oauth.create_client(provider)
    try:
        token = await client.authorize_access_token(request)
    except Exception as e:
        frontend_redirect = "http://localhost:5173/login"
        return RedirectResponse(f"{frontend_redirect}?error=oauth_failed")

    if provider == 'google':
        user_info = token.get('userinfo')
        if not user_info:
            raise HTTPException(status_code=400, detail="No user info from Google")
        email = user_info.get('email')
        provider_id = user_info.get('sub')
        name = user_info.get('name')
    elif provider == 'github':
        resp = await client.get('user', token=token)
        user_info = resp.json()
        
        # Github might not return email directly if it's private, we'd have to call /user/emails
        email = user_info.get('email')
        if not email:
            resp_emails = await client.get('user/emails', token=token)
            emails = resp_emails.json()
            primary_email = next((e for e in emails if e.get('primary')), None)
            if primary_email:
                email = primary_email.get('email')
                
        provider_id = str(user_info.get('id'))
        name = user_info.get('name') or user_info.get('login')
    
    if not email:
        raise HTTPException(status_code=400, detail="OAuth provider did not return an email")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=name,
            hashed_password=None # Nullable for OAuth users
        )
        db.add(user)
    
    if provider == 'google':
        user.google_id = provider_id
    elif provider == 'github':
        user.github_id = provider_id

    db.commit()
    db.refresh(user)

    frontend_redirect = "http://localhost:5173/oauth/callback"
    
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    return RedirectResponse(f"{frontend_redirect}?access_token={access_token}&refresh_token={refresh_token}")
