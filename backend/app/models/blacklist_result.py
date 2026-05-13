import uuid
from sqlalchemy import Column, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from datetime import datetime, timezone
from app.db.base import Base

class BlacklistResult(Base):
    __tablename__ = "blacklist_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    domain_id = Column(UUID(as_uuid=True), ForeignKey("domains.id"), nullable=False)
    checked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    is_listed = Column(Boolean, default=False)
    results = Column(JSON, default=list)
