from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from datetime import datetime, timedelta, timezone
from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.domain import Domain
from app.models.metric_snapshot import MetricSnapshot
from app.core.rate_limiter import limiter

router = APIRouter()

def get_domain_or_404(db: Session, domain_id: UUID, current_user: User) -> Domain:
    domain = db.query(Domain).filter(Domain.id == domain_id, Domain.user_id == current_user.id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    return domain

@router.get("/{domain_id}/summary")
@limiter.limit("60/minute")
def get_metrics_summary(request: Request, domain_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domain = get_domain_or_404(db, domain_id, current_user)
    return {
        "domain": domain.domain,
        "health_score": domain.health_score,
        "last_checked_at": domain.last_checked_at
    }

@router.get("/{domain_id}/score-history")
@limiter.limit("60/minute")
def get_score_history(request: Request, domain_id: UUID, days: int = 30, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domain = get_domain_or_404(db, domain_id, current_user)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    snapshots = db.query(MetricSnapshot).filter(
        MetricSnapshot.domain_id == domain.id,
        MetricSnapshot.date >= cutoff.date()
    ).order_by(MetricSnapshot.date.asc()).all()
    
    return [
        {"date": s.date.isoformat(), "health_score": s.health_score} for s in snapshots
    ]
