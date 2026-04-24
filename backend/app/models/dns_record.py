from sqlalchemy import Column, Integer, JSON, DateTime, ForeignKey
from datetime import datetime, timezone
from app.db.base import Base

class DnsRecord(Base):
    __tablename__ = "dns_records"

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    checked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    spf = Column(JSON, nullable=True) # { "status": "pass", "record": "v=spf1 include:sendgrid.net ~all" }
    dkim = Column(JSON, nullable=True)
    dmarc = Column(JSON, nullable=True)
    mx = Column(JSON, nullable=True)
