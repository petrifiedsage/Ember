from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class InboxConnectionBase(BaseModel):
    provider: str
    email: str
    smtp_host: Optional[str] = None
    imap_host: Optional[str] = None


class InboxConnectionCreate(InboxConnectionBase):
    pass


class InboxConnectionUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_warmup_enabled: Optional[bool] = None
    daily_limit: Optional[int] = None
    email: Optional[str] = None
    smtp_host: Optional[str] = None
    imap_host: Optional[str] = None


class InboxConnectionResponse(InboxConnectionBase):
    id: int
    user_id: int
    is_active: bool
    is_warmup_enabled: bool
    daily_limit: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
