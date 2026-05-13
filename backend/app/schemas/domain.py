from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from uuid import UUID
import re

domain_regex = re.compile(
    r"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$"
)

class DomainCreate(BaseModel):
    domain: str = Field(..., description="The domain name (e.g., mycompany.com)")

    @field_validator('domain')
    @classmethod
    def validate_domain(cls, v: str) -> str:
        if not domain_regex.match(v):
            raise ValueError("Invalid domain format")
        return v

class DomainResponse(BaseModel):
    id: UUID
    domain: str
    health_score: int | None = None
    status: str
    added_at: datetime
    last_checked_at: datetime | None = None

    model_config = {"from_attributes": True}
