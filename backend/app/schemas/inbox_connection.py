from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class InboxConnectionBase(BaseModel):
    provider: str
    email: str


class InboxConnectionCreate(InboxConnectionBase):
    pass


class InboxConnectionUpdate(BaseModel):
    is_active: Optional[bool] = None
    email: Optional[str] = None


class InboxConnectionResponse(InboxConnectionBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
