import uuid
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True) # Nullable for OAuth users
    name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)
    
    # MFA
    mfa_secret = Column(String, nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    
    # OAuth
    google_id = Column(String, nullable=True, unique=True, index=True)
    github_id = Column(String, nullable=True, unique=True, index=True)

    @property
    def is_oauth(self) -> bool:
        return self.google_id is not None or self.github_id is not None
