import requests
from urllib.parse import urlencode
from app.config import settings

# Google OAuth endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "openid",
    "email"
]

def get_google_auth_url(state: str) -> str:
    """Build the Google OAuth consent URL"""
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

def exchange_code_for_tokens(code: str) -> dict:
    """Exchange auth code for access + refresh tokens"""
    data = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
    }
    response = requests.post(GOOGLE_TOKEN_URL, data=data)
    # Give a clear error if Google rejects the exchange
    if not response.ok:
        raise ValueError(f"Failed to exchange token: {response.text}")
    return response.json()

def refresh_access_token(refresh_token: str) -> dict:
    """Refreshes an expired Google access token"""
    data = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }
    response = requests.post(GOOGLE_TOKEN_URL, data=data)
    if not response.ok:
         raise ValueError(f"Failed to refresh token: {response.text}")
    return response.json()

def get_user_email(access_token: str) -> str:
    """Calls Gmail API to get the authenticated user's email address"""
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get("https://gmail.googleapis.com/gmail/v1/users/me/profile", headers=headers)
    if not response.ok:
         raise ValueError(f"Failed to fetch profile: {response.text}")
    return response.json().get("emailAddress")
