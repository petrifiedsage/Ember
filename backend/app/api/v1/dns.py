from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional
from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.domain import Domain
from app.models.dns_record import DnsRecord
from app.schemas.dns import DnsCheckResult, DnsHistoryItem, RecordStatus, MxStatus
from app.services.dns_checker import check_domain_dns

router = APIRouter()

def get_domain_or_404(db: Session, domain_id: UUID, current_user: User) -> Domain:
    domain = db.query(Domain).filter(Domain.id == domain_id, Domain.user_id == current_user.id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    return domain

@router.get("/{domain_id}/latest", response_model=DnsCheckResult)
def get_latest_dns(domain_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domain = get_domain_or_404(db, domain_id, current_user)
    
    record = db.query(DnsRecord).filter(DnsRecord.domain_id == domain.id).order_by(DnsRecord.checked_at.desc()).first()
    if not record:
        # If no record exists, run a synchronous check (Sprint 1 requirement)
        return run_dns_check(domain_id, db, current_user)
        
    return DnsCheckResult(
        checked_at=record.checked_at,
        spf=RecordStatus(status=record.spf_status or "fail", record=record.spf_record),
        dkim=RecordStatus(status=record.dkim_status or "fail", record=record.dkim_record),
        dmarc=RecordStatus(status=record.dmarc_status or "fail", record=record.dmarc_record),
        mx=MxStatus(status=record.mx_status or "fail", records=record.mx_records or [])
    )

@router.post("/{domain_id}/run", response_model=DnsCheckResult, status_code=status.HTTP_201_CREATED)
def run_dns_check(domain_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domain = get_domain_or_404(db, domain_id, current_user)
    
    result = check_domain_dns(domain.domain)
    
    new_record = DnsRecord(
        domain_id=domain.id,
        checked_at=result.checked_at,
        spf_status=result.spf.status,
        spf_record=result.spf.record,
        dkim_status=result.dkim.status,
        dkim_record=result.dkim.record,
        dmarc_status=result.dmarc.status,
        dmarc_record=result.dmarc.record,
        mx_status=result.mx.status,
        mx_records=result.mx.records
    )
    db.add(new_record)
    domain.last_checked_at = result.checked_at
    db.commit()
    db.refresh(new_record)
    
    return result

@router.get("/{domain_id}/history", response_model=List[DnsHistoryItem])
def get_dns_history(
    domain_id: UUID, 
    from_date: Optional[datetime] = None, 
    to_date: Optional[datetime] = None, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    domain = get_domain_or_404(db, domain_id, current_user)
    
    query = db.query(DnsRecord).filter(DnsRecord.domain_id == domain.id)
    if from_date:
        query = query.filter(DnsRecord.checked_at >= from_date)
    if to_date:
        query = query.filter(DnsRecord.checked_at <= to_date)
        
    records = query.order_by(DnsRecord.checked_at.desc()).all()
    
    return [
        DnsHistoryItem(
            date=r.checked_at,
            spf_status=r.spf_status,
            dkim_status=r.dkim_status,
            dmarc_status=r.dmarc_status
        ) for r in records
    ]
