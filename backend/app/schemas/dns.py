from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class RecordStatus(BaseModel):
    status: str # pass, warn, fail
    record: Optional[str] = None
    note: Optional[str] = None

class MxStatus(BaseModel):
    status: str
    records: List[str] = []

class DnsCheckResult(BaseModel):
    checked_at: datetime
    spf: RecordStatus
    dkim: RecordStatus
    dmarc: RecordStatus
    mx: MxStatus

class DnsHistoryItem(BaseModel):
    date: datetime
    spf_status: str | None
    dkim_status: str | None
    dmarc_status: str | None

    model_config = {"from_attributes": True}
