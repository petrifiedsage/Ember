from datetime import datetime
from typing import Any

from pydantic import BaseModel


class DNSLatestResponse(BaseModel):
    checked_at: datetime
    spf: dict[str, Any]
    dkim: dict[str, Any]
    dmarc: dict[str, Any]
    mx: dict[str, Any]
