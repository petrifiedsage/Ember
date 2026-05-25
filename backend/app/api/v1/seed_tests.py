from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone
from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.domain import Domain
from app.models.seed_test import SeedTest
from app.models.seed_test_result import SeedTestResult
from app.workers.queue import redis_settings
from arq import create_pool
import json
import os
from pathlib import Path
from app.core.rate_limiter import limiter

router = APIRouter()

def get_domain_or_404(db: Session, domain_id: UUID, current_user: User) -> Domain:
    domain = db.query(Domain).filter(Domain.id == domain_id, Domain.user_id == current_user.id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    return domain

class SeedTestCreate(BaseModel):
    subject_hint: str

@router.post("/{domain_id}/run", status_code=status.HTTP_201_CREATED)
@limiter.limit("60/minute")
async def create_seed_test(
    request: Request, 
    domain_id: UUID, 
    payload: SeedTestCreate,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    domain = get_domain_or_404(db, domain_id, current_user)
    
    test = SeedTest(
        domain_id=domain.id,
        status="awaiting_email",
        subject_hint=payload.subject_hint,
        created_at=datetime.now(timezone.utc)
    )
    db.add(test)
    db.commit()
    db.refresh(test)
    
    redis = await create_pool(redis_settings)
    await redis.enqueue_job("run_seed_poll_task", str(test.id), _defer_by=60)
    
    # Return actual seed addresses from seed_accounts.json
    seed_addresses = []
    seed_file = Path("seed_accounts.json")
    if seed_file.exists():
        try:
            with open(seed_file, "r") as f:
                accounts = json.load(f)
                seed_addresses = [acc["email"] for acc in accounts if "email" in acc]
        except Exception:
            pass
            
    if not seed_addresses:
        # Fallback if file doesn't exist or is empty
        seed_addresses = ["please-configure-seed_accounts.json@example.com"]
    
    return {"test_id": str(test.id), "subject_hint": test.subject_hint, "seed_addresses": seed_addresses}

@router.get("/{domain_id}")
@limiter.limit("60/minute")
def list_seed_tests(request: Request, domain_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domain = get_domain_or_404(db, domain_id, current_user)
    tests = db.query(SeedTest).filter(SeedTest.domain_id == domain.id).order_by(SeedTest.created_at.desc()).all()
    return tests

@router.get("/tests/{test_id}/result")
@limiter.limit("60/minute")
def get_seed_test_result(request: Request, test_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    test = db.query(SeedTest).filter(SeedTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    domain = db.query(Domain).filter(Domain.id == test.domain_id, Domain.user_id == current_user.id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Test not found")
        
    results = db.query(SeedTestResult).filter(SeedTestResult.seed_test_id == test.id).all()
    return {
        "status": test.status,
        "subject_hint": test.subject_hint,
        "created_at": test.created_at,
        "results": results
    }
