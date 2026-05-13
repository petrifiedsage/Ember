from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.domain import Domain
from app.models.alert_rule import AlertRule

router = APIRouter()

class AlertRuleCreate(BaseModel):
    condition: str
    threshold: int
    channel: str
    target: str

def get_domain_or_404(db: Session, domain_id: UUID, current_user: User) -> Domain:
    domain = db.query(Domain).filter(Domain.id == domain_id, Domain.user_id == current_user.id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    return domain

@router.get("/{domain_id}")
def list_alerts(domain_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domain = get_domain_or_404(db, domain_id, current_user)
    rules = db.query(AlertRule).filter(AlertRule.domain_id == domain.id).all()
    return rules

@router.post("/{domain_id}", status_code=status.HTTP_201_CREATED)
def create_alert(domain_id: UUID, rule_in: AlertRuleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    domain = get_domain_or_404(db, domain_id, current_user)
    rule = AlertRule(
        domain_id=domain.id,
        condition=rule_in.condition,
        threshold=rule_in.threshold,
        channel=rule_in.channel,
        target=rule_in.target
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(alert_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rule = db.query(AlertRule).filter(AlertRule.id == alert_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    
    domain = db.query(Domain).filter(Domain.id == rule.domain_id, Domain.user_id == current_user.id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Alert rule not found")
        
    db.delete(rule)
    db.commit()
