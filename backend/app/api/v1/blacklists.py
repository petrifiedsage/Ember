from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.domain import Domain
from app.models.blacklist_result import BlacklistResult
from app.workers.queue import redis_settings
from arq import create_pool

router = APIRouter()

def get_domain_or_404(db: Session, domain_id: UUID, current_user: User) -> Domain:
    domain = db.query(Domain).filter(Domain.id == domain_id, Domain.user_id == current_user.id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    return domain

@router.get("/{domain_id}/latest")
def get_latest_blacklist(domain_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domain = get_domain_or_404(db, domain_id, current_user)
    record = db.query(BlacklistResult).filter(BlacklistResult.domain_id == domain.id).order_by(BlacklistResult.checked_at.desc()).first()
    if not record:
        return {"status": "no_data"}
    return {
        "checked_at": record.checked_at,
        "is_listed": record.is_listed,
        "results": record.results
    }

@router.post("/{domain_id}/run", status_code=status.HTTP_202_ACCEPTED)
async def run_blacklist_check(domain_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domain = get_domain_or_404(db, domain_id, current_user)
    redis = await create_pool(redis_settings)
    await redis.enqueue_job("run_blacklist_check_task", str(domain.id))
    return {"status": "enqueued"}
