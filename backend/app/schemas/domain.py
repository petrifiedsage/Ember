from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from uuid import UUID
import re

domain_regex = re.compile(
    r"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$"
)

class DomainCreate(BaseModel):
    domain: str = Field(..., description="The domain name (e.g., mycompany.com)")

    @field_validator('domain', mode='before')
    @classmethod
    def clean_and_validate_domain(cls, v: str) -> str:
        # Clean the input first
        v = v.strip()
        v = re.sub(r"^https?://", "", v)
        v = re.sub(r"^www\.", "", v)
        v = v.split('/')[0].lower()
        
        # Then validate
        if not domain_regex.match(v):
            raise ValueError(f"Invalid domain format: {v}")
        return v

class DomainResponse(BaseModel):
    id: UUID
    domain: str
    health_score: int | None = None
    status: str
    added_at: datetime
    last_checked_at: datetime | None = None
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_username: str | None = None
    # Password is intentionally excluded from the response for security

    model_config = {"from_attributes": True}

class DomainSmtpUpdate(BaseModel):
    smtp_host: str | None = Field(None, description="SMTP server hostname (e.g. smtp.sendgrid.net)")
    smtp_port: int | None = Field(None, description="SMTP server port (e.g. 587 or 465)")
    smtp_username: str | None = Field(None, description="SMTP username")
    smtp_password: str | None = Field(None, description="SMTP password")
