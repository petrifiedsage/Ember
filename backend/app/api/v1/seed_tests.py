from fastapi import APIRouter, Depends, HTTPException, status
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
import string
import random

router = APIRouter()

def get_domain_or_404(db: Session, domain_id: UUID, current_user: User) -> Domain:
    domain = db.query(Domain).filter(Domain.id == domain_id, Domain.user_id == current_user.id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    return domain

@router.post("/{domain_id}/run", status_code=status.HTTP_201_CREATED)
async def create_seed_test(domain_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domain = get_domain_or_404(db, domain_id, current_user)
    
    hint = "ember-seed-" + ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    
    test = SeedTest(
        domain_id=domain.id,
        status="pending",
        subject_hint=hint,
        created_at=datetime.now(timezone.utc)
    )
    db.add(test)
    db.commit()
    db.refresh(test)
    
    redis = await create_pool(redis_settings)
    await redis.enqueue_job("run_seed_poll_task", str(test.id), _defer_by=60)
    
    return {"test_id": test.id, "subject_hint": hint}

@router.get("/{domain_id}")
def list_seed_tests(domain_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domain = get_domain_or_404(db, domain_id, current_user)
    tests = db.query(SeedTest).filter(SeedTest.domain_id == domain.id).order_by(SeedTest.created_at.desc()).all()
    return tests

@router.get("/tests/{test_id}/result")
def get_seed_test_result(test_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    test = db.query(SeedTest).filter(SeedTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    domain = db.query(Domain).filter(Domain.id == test.domain_id, Domain.user_id == current_user.id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Test not found")
        
    results = db.query(SeedTestResult).filter(SeedTestResult.test_id == test.id).all()
    return {
        "status": test.status,
        "subject_hint": test.subject_hint,
        "created_at": test.created_at,
        "results": results
    }
