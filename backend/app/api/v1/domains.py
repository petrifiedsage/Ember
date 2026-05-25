from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.deps import get_db, get_current_user
from app.schemas.domain import DomainCreate, DomainResponse, DomainSmtpUpdate
from app.models.domain import Domain
from app.models.user import User
from app.models.dns_record import DnsRecord
from app.models.blacklist_result import BlacklistResult
from app.models.seed_test import SeedTest
from app.models.metric_snapshot import MetricSnapshot
from app.models.alert_rule import AlertRule
from app.core.rate_limiter import limiter
import re

router = APIRouter()

@router.get("", response_model=List[DomainResponse])
@limiter.limit("60/minute")
def get_domains(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domains = db.query(Domain).filter(Domain.user_id == current_user.id).all()
    return domains

@router.post("", response_model=DomainResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("60/minute")
def create_domain(request: Request, domain_in: DomainCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Clean the domain input
    raw_domain = domain_in.domain.strip()
    cleaned_domain = re.sub(r"^https?://", "", raw_domain)
    cleaned_domain = re.sub(r"^www\.", "", cleaned_domain)
    cleaned_domain = cleaned_domain.split('/')[0].lower()

    existing = db.query(Domain).filter(Domain.domain == cleaned_domain, Domain.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Domain already tracked by this user")
    
    new_domain = Domain(
        user_id=current_user.id,
        domain=cleaned_domain
    )
    db.add(new_domain)
    db.commit()
    db.refresh(new_domain)
    return new_domain

@router.delete("/{domain_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("60/minute")
def delete_domain(request: Request, domain_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domain = db.query(Domain).filter(Domain.id == domain_id, Domain.user_id == current_user.id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    # Manually delete dependent records to prevent foreign key violations
    db.query(DnsRecord).filter(DnsRecord.domain_id == domain.id).delete()
    db.query(BlacklistResult).filter(BlacklistResult.domain_id == domain.id).delete()
    db.query(SeedTest).filter(SeedTest.domain_id == domain.id).delete()
    db.query(MetricSnapshot).filter(MetricSnapshot.domain_id == domain.id).delete()
    db.query(AlertRule).filter(AlertRule.domain_id == domain.id).delete()
    
    db.delete(domain)
    db.commit()
    return None

@router.patch("/{domain_id}/smtp", response_model=DomainResponse)
@limiter.limit("60/minute")
def update_domain_smtp(request: Request, domain_id: UUID, smtp_in: DomainSmtpUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domain = db.query(Domain).filter(Domain.id == domain_id, Domain.user_id == current_user.id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    domain.smtp_host = smtp_in.smtp_host
    domain.smtp_port = smtp_in.smtp_port
    domain.smtp_username = smtp_in.smtp_username
    
    # Only update password if provided (it might be omitted to keep existing)
    if smtp_in.smtp_password is not None:
        domain.smtp_password = smtp_in.smtp_password
        
    db.commit()
    db.refresh(domain)
    return domain
