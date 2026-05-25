import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.db.base import Base

class Domain(Base):
    __tablename__ = "domains"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    domain = Column(String, index=True, nullable=False)
    status = Column(String, default="active")
    health_score = Column(Integer, nullable=True)
    added_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    
    # SMTP Integration for Auto-Send Seed Tests
    smtp_host = Column(String, nullable=True)
    smtp_port = Column(Integer, nullable=True)
    smtp_username = Column(String, nullable=True)
    smtp_password = Column(String, nullable=True)

    user = relationship("User", backref="domains")
