from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean, JSON
from datetime import datetime, timezone
from app.db.base import Base

class BlacklistResult(Base):
    __tablename__ = "blacklist_results"

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    checked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    clean = Column(Boolean, default=True)
    hits = Column(JSON, default=list)
