from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class InboxConnection(Base):
    __tablename__ = "inbox_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String, nullable=False)  # gmail, outlook, smtp, imap
    email = Column(String, nullable=False)

    # OAuth / SMTP credentials (stored encrypted)
    access_token = Column(String, nullable=True)
    refresh_token = Column(String, nullable=True)
    smtp_host = Column(String, nullable=True)
    imap_host = Column(String, nullable=True)

    # Warm-up settings
    is_active = Column(Boolean, default=True)
    is_warmup_enabled = Column(Boolean, default=False)
    daily_limit = Column(Integer, default=20)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="inbox_connections")
