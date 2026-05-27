from pydantic import BaseModel, EmailStr
from uuid import UUID

class UserCreate(BaseModel):
    name: str | None = None
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"
    mfa_required: bool = False
    temp_token: str | None = None

class RefreshToken(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    name: str | None = None
    mfa_enabled: bool = False
    is_oauth: bool = False

    model_config = {"from_attributes": True}

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class MfaSetupResponse(BaseModel):
    secret: str
    qr_code_uri: str

class MfaVerifyRequest(BaseModel):
    code: str

class MfaLoginRequest(BaseModel):
    temp_token: str
    code: str
