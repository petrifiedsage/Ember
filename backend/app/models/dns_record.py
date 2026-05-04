import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime, timezone
from app.db.base import Base

class DnsRecord(Base):
    __tablename__ = "dns_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    domain_id = Column(UUID(as_uuid=True), ForeignKey("domains.id"), nullable=False)
    checked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    spf_status = Column(String, nullable=True)
    spf_record = Column(Text, nullable=True)
    
    dkim_status = Column(String, nullable=True)
    dkim_record = Column(Text, nullable=True)
    
    dmarc_status = Column(String, nullable=True)
    dmarc_record = Column(Text, nullable=True)
    
    mx_status = Column(String, nullable=True)
    mx_records = Column(JSONB, nullable=True)
