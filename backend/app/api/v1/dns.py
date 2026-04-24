from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.deps import get_current_user
from app.db.session import get_db
from app.models.dns_record import DnsRecord
from app.models.domain import Domain
from app.models.user import User
from app.schemas.dns import DNSLatestResponse
from app.services.dns_checker import check_domain_dns

router = APIRouter()


@router.get("/dns/{domain_id}/latest", response_model=DNSLatestResponse)
def get_latest_dns_result(
    domain_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DNSLatestResponse:
    domain = db.scalar(select(Domain).where(Domain.id == domain_id, Domain.user_id == current_user.id))
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")

    latest = db.scalar(
        select(DnsRecord).where(DnsRecord.domain_id == domain.id).order_by(desc(DnsRecord.checked_at))
    )

    if latest is None:
        result = check_domain_dns(domain.name)
        latest = DnsRecord(
            domain_id=domain.id,
            spf=result["spf"],
            dkim=result["dkim"],
            dmarc=result["dmarc"],
            mx=result["mx"],
        )
        db.add(latest)
        db.commit()
        db.refresh(latest)

    return DNSLatestResponse(
        checked_at=latest.checked_at,
        spf=latest.spf or {},
        dkim=latest.dkim or {},
        dmarc=latest.dmarc or {},
        mx=latest.mx or {},
    )
