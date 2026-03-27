from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from app.config import settings

SECRET = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = 7


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token (short-lived)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token (long-lived, 7 days)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token (access or refresh)"""
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify an access token specifically"""
    payload = decode_token(token)
    if payload and payload.get("type") == "access":
        return payload
    return None


def decode_refresh_token(token: str) -> Optional[dict]:
    """Decode and verify a refresh token specifically"""
    payload = decode_token(token)
    if payload and payload.get("type") == "refresh":
        return payload
    return None
