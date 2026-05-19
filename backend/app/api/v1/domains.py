from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.deps import get_db, get_current_user
from app.schemas.domain import DomainCreate, DomainResponse
from app.models.domain import Domain
from app.models.user import User
from app.core.rate_limiter import limiter

router = APIRouter()

@router.get("", response_model=List[DomainResponse])
@limiter.limit("60/minute")
def get_domains(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domains = db.query(Domain).filter(Domain.user_id == current_user.id).all()
    return domains

@router.post("", response_model=DomainResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("60/minute")
def create_domain(request: Request, domain_in: DomainCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Domain).filter(Domain.domain == domain_in.domain, Domain.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Domain already tracked by this user")
    
    new_domain = Domain(
        user_id=current_user.id,
        domain=domain_in.domain
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
    
    db.delete(domain)
    db.commit()
    return None
