from sqlalchemy import Column, Integer, Date, ForeignKey, Float
from app.db.base import Base

class MetricSnapshot(Base):
    __tablename__ = "metric_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    date = Column(Date, nullable=False)
    health_score = Column(Float, nullable=False)
