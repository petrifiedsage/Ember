import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_current_user
from app.db.session import get_db
from app.models.domain import Domain
from app.models.user import User
from app.schemas.domain import DomainCreateRequest, DomainResponse

router = APIRouter()

DOMAIN_REGEX = re.compile(r"^(?!-)(?:[A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,63}$")


@router.get("/domains", response_model=list[DomainResponse])
def list_domains(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[DomainResponse]:
    rows = db.scalars(select(Domain).where(Domain.user_id == current_user.id)).all()
    return [
        DomainResponse(
            id=row.id,
            domain=row.name,
            health_score=row.health_score,
            status=row.status,
            added_at=row.added_at,
        )
        for row in rows
    ]


@router.post("/domains", response_model=DomainResponse, status_code=status.HTTP_201_CREATED)
def create_domain(
    payload: DomainCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DomainResponse:
    domain_name = payload.domain.strip().lower()
    if not DOMAIN_REGEX.match(domain_name):
        raise HTTPException(status_code=400, detail="Invalid domain format")

    existing = db.scalar(
        select(Domain).where(Domain.user_id == current_user.id, Domain.name == domain_name)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Domain already tracked")

    record = Domain(user_id=current_user.id, name=domain_name)
    db.add(record)
    db.commit()
    db.refresh(record)
    return DomainResponse(
        id=record.id,
        domain=record.name,
        health_score=record.health_score,
        status=record.status,
        added_at=record.added_at,
    )


@router.delete("/domains/{domain_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_domain(
    domain_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    record = db.scalar(select(Domain).where(Domain.id == domain_id, Domain.user_id == current_user.id))
    if not record:
        raise HTTPException(status_code=404, detail="Domain not found")
    db.delete(record)
    db.commit()
    return None
