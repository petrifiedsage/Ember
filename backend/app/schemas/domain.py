from datetime import datetime

from pydantic import BaseModel, Field


class DomainCreateRequest(BaseModel):
    domain: str = Field(min_length=3, max_length=255)


class DomainResponse(BaseModel):
    id: int
    domain: str
    health_score: float
    status: str
    added_at: datetime
