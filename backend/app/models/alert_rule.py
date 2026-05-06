import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.db.base import Base

class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    domain_id = Column(UUID(as_uuid=True), ForeignKey("domains.id"), nullable=False)
    condition = Column(String, nullable=False)
    threshold = Column(Integer, nullable=False)
    channel = Column(String, nullable=False)
    target = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    last_fired_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
