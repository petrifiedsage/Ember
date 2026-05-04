import uuid
from sqlalchemy import Column, Integer, Date, ForeignKey, String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class MetricSnapshot(Base):
    __tablename__ = "metric_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    domain_id = Column(UUID(as_uuid=True), ForeignKey("domains.id"), nullable=False)
    date = Column(Date, nullable=False)
    health_score = Column(Integer, nullable=True)
    
    spf_status = Column(String, nullable=True)
    dkim_status = Column(String, nullable=True)
    dmarc_status = Column(String, nullable=True)
    blacklisted = Column(Boolean, nullable=True)
