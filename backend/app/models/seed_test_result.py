import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.db.base import Base

class SeedTestResult(Base):
    __tablename__ = "seed_test_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seed_test_id = Column(UUID(as_uuid=True), ForeignKey("seed_tests.id"), nullable=False)
    provider = Column(String, nullable=False) # gmail / outlook / yahoo
    placement = Column(String, nullable=False) # inbox / spam / promotions / not_found
    checked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
