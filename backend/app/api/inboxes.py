from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse

from app.db.session import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.inbox_connection import InboxConnection
from app.schemas.inbox_connection import InboxConnectionCreate, InboxConnectionUpdate, InboxConnectionResponse
from app.services.encryption import encrypt_token, decrypt_token
from app.services.gmail_oauth import get_google_auth_url, exchange_code_for_tokens, get_user_email, refresh_access_token
from app.services.email_client import GmailClient
from app.config import settings
from app.core.rate_limiter import limiter

router = APIRouter()

@router.get("", response_model=List[InboxConnectionResponse])
@limiter.limit("60/minute")
def get_inboxes(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all inbox connections for the logged-in user"""
    inboxes = db.query(InboxConnection).filter(InboxConnection.user_id == current_user.id).all()
    return inboxes

@router.post("", response_model=InboxConnectionResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("60/minute")
def create_inbox(request: Request, inbox_data: InboxConnectionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new manual inbox connection (SMTP/IMAP mostly)"""
    new_inbox = InboxConnection(
        user_id=current_user.id,
        provider=inbox_data.provider,
        email=inbox_data.email,
        smtp_host=inbox_data.smtp_host,
        imap_host=inbox_data.imap_host,
    )
    db.add(new_inbox)
    db.commit()
    db.refresh(new_inbox)
    return new_inbox

@router.patch("/{inbox_id}", response_model=InboxConnectionResponse)
@limiter.limit("60/minute")
def update_inbox(request: Request, inbox_id: int, inbox_update: InboxConnectionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update an inbox's settings (warmup status, daily limit)"""
    inbox = db.query(InboxConnection).filter(InboxConnection.id == inbox_id, InboxConnection.user_id == current_user.id).first()
    if not inbox:
        raise HTTPException(status_code=404, detail="Inbox not found")
        
    update_data = inbox_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(inbox, key, value)
        
    db.commit()
    db.refresh(inbox)
    return inbox

@router.delete("/{inbox_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("60/minute")
def delete_inbox(request: Request, inbox_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Remove an inbox connection completely"""
    inbox = db.query(InboxConnection).filter(InboxConnection.id == inbox_id, InboxConnection.user_id == current_user.id).first()
    if not inbox:
        raise HTTPException(status_code=404, detail="Inbox not found")
        
    db.delete(inbox)
    db.commit()
    return None

# OAuth flow
@router.get("/oauth/gmail/start")
@limiter.limit("60/minute")
def gmail_oauth_start(request: Request, current_user: User = Depends(get_current_user)):
    """Starts the Gmail OAuth flow, tying the state query param to the user_id"""
    state_token = encrypt_token(str(current_user.id))
    url = get_google_auth_url(state=state_token)
    return {"url": url}

@router.get("/oauth/callback")
@limiter.limit("60/minute")
def gmail_oauth_callback(request: Request, code: str = Query(...), state: str = Query(...), db: Session = Depends(get_db)):
    """Endpoint that handles the Google callback code, exchanging it for tokens and tying it to the user."""
    # 1. Decode state to verify user
    try:
        user_id_str = decrypt_token(state)
        user_id = int(user_id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User mapping not found")

    # 2. Exchange code for tokens
    try:
        tokens = exchange_code_for_tokens(code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token") # Note: Google only provides refresh token on first authorization unless prompted otherwise.

    if not access_token:
        raise HTTPException(status_code=400, detail="No access token returned from Google")

    # 3. Get User Email
    try:
        gmail_address = get_user_email(access_token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch profile: {str(e)}")

    # 4. Save/Update records with Encrypted Tokens
    existing_inbox = db.query(InboxConnection).filter(
        InboxConnection.user_id == user.id, 
        InboxConnection.email == gmail_address,
        InboxConnection.provider == "gmail"
    ).first()

    enc_access = encrypt_token(access_token)
    enc_refresh = encrypt_token(refresh_token) if refresh_token else None

    if existing_inbox:
        existing_inbox.access_token = enc_access
        if enc_refresh:
            existing_inbox.refresh_token = enc_refresh
        existing_inbox.is_active = True
        db.commit()
    else:
        new_inbox = InboxConnection(
            user_id=user.id,
            provider="gmail",
            email=gmail_address,
            access_token=enc_access,
            refresh_token=enc_refresh,
            is_active=True
        )
        db.add(new_inbox)
        db.commit()

    # In a full app, we would redirect back to the frontend dashboard instead of returning JSON
    return RedirectResponse(url=f"{settings.frontend_url}/dashboard?oauth=success")


@router.post("/{inbox_id}/test")
@limiter.limit("60/minute")
def test_send_email(request: Request, inbox_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Send a test email using the inbox credentials"""
    inbox = db.query(InboxConnection).filter(InboxConnection.id == inbox_id, InboxConnection.user_id == current_user.id).first()
    if not inbox:
        raise HTTPException(status_code=404, detail="Inbox not found")

    if inbox.provider != "gmail":
        raise HTTPException(status_code=400, detail="Only Gmail OAuth providers supported currently")

    if not inbox.access_token:
        raise HTTPException(status_code=400, detail="No access token found for this inbox")

    plain_access = decrypt_token(inbox.access_token)
    client = GmailClient(access_token=plain_access)

    try:
        # Optimistic send
        result = client.send_email(
            to=inbox.email, # Send back to ourselves
            subject="Ember Email Warmup - Test Authentication",
            body="If you're reading this, your Ember OAuth connection is successfully working. Your backend can now safely interact with Gmail."
        )
        return {"success": True, "message_id": result.get("id")}
    except Exception as initial_error:
        # If the access token expired, attempt to gracefully refresh it
        if "401" in str(initial_error) and inbox.refresh_token:
            try:
                plain_refresh = decrypt_token(inbox.refresh_token)
                new_tokens = refresh_access_token(plain_refresh)
                new_access_token = new_tokens.get("access_token")

                # Re-encrypt and save newly minted access token!
                inbox.access_token = encrypt_token(new_access_token)
                db.commit()

                # Retry sending!
                new_client = GmailClient(access_token=new_access_token)
                result = new_client.send_email(
                    to=inbox.email,
                    subject="Ember Email Warmup - Test Authentication (Refreshed)",
                    body="If you're reading this, your Ember OAuth connection is successfully working after automatically refreshing your access token!"
                )
                return {"success": True, "message_id": result.get("id"), "refreshed": True}
            except Exception as e:
                raise HTTPException(status_code=401, detail=f"Token expired and refresh failed: {str(e)}")
        
        # If it wasn't a 401 or we don't have a refresh token, fail completely
        raise HTTPException(status_code=400, detail=f"Failed to send email: {str(initial_error)}")
