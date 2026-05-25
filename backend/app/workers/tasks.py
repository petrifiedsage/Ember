from typing import Any
from app.workers.queue import redis_settings
from app.db.session import SessionLocal
from app.models.domain import Domain
from app.models.dns_record import DnsRecord
from app.models.blacklist_result import BlacklistResult
from app.models.metric_snapshot import MetricSnapshot
from app.models.seed_test import SeedTest
from app.models.seed_test_result import SeedTestResult
from app.services.dns_checker import check_domain_dns
from app.services.blacklist_checker import check_blacklist
from app.services.seed_monitor import check_seed_placement
from app.services.alerting import evaluate_and_alert
from app.core.scoring import compute_score
from datetime import datetime, timezone

def update_domain_score(db, domain):
    latest_dns = db.query(DnsRecord).filter(DnsRecord.domain_id == domain.id).order_by(DnsRecord.checked_at.desc()).first()
    latest_bl = db.query(BlacklistResult).filter(BlacklistResult.domain_id == domain.id).order_by(BlacklistResult.checked_at.desc()).first()
    
    dns_dict = {}
    if latest_dns:
        dns_dict = {
            "spf": {"status": latest_dns.spf_status},
            "dkim": {"status": latest_dns.dkim_status},
            "dmarc": {"status": latest_dns.dmarc_status},
            "mx": {"status": latest_dns.mx_status}
        }
        
    bl_dict = {}
    if latest_bl:
        bl_dict = {"is_listed": latest_bl.is_listed}
        
    new_score = compute_score(dns_dict, bl_dict)
    old_score = domain.health_score or 0
    domain.health_score = new_score
    
    snapshot = MetricSnapshot(
        domain_id=domain.id, 
        date=datetime.now(timezone.utc).date(), 
        health_score=new_score,
        spf_status=latest_dns.spf_status if latest_dns else None,
        dkim_status=latest_dns.dkim_status if latest_dns else None,
        dmarc_status=latest_dns.dmarc_status if latest_dns else None,
        blacklisted=latest_bl.is_listed if latest_bl else False
    )
    db.add(snapshot)
    
    has_blacklist_hit = latest_bl.is_listed if latest_bl else False
    evaluate_and_alert(str(domain.id), new_score, old_score, has_blacklist_hit)

async def run_dns_check_task(ctx: dict, domain_id: str) -> None:
    db = SessionLocal()
    try:
        domain = db.query(Domain).filter(Domain.id == domain_id).first()
        if not domain: return
        
        result = check_domain_dns(domain.domain)
        new_record = DnsRecord(
            domain_id=domain.id, checked_at=result.checked_at,
            spf_status=result.spf.status, spf_record=result.spf.record,
            dkim_status=result.dkim.status, dkim_record=result.dkim.record,
            dmarc_status=result.dmarc.status, dmarc_record=result.dmarc.record,
            mx_status=result.mx.status, mx_records=result.mx.records
        )
        db.add(new_record)
        update_domain_score(db, domain)
        db.commit()
    finally:
        db.close()

async def run_blacklist_check_task(ctx: dict, domain_id: str) -> None:
    db = SessionLocal()
    try:
        domain = db.query(Domain).filter(Domain.id == domain_id).first()
        if not domain: return
        
        bl_res = check_blacklist(domain.domain)
        new_bl = BlacklistResult(
            domain_id=domain.id, checked_at=datetime.fromisoformat(bl_res['checked_at']),
            is_listed=bl_res['is_listed'], results=bl_res['results']
        )
        db.add(new_bl)
        update_domain_score(db, domain)
        db.commit()
    finally:
        db.close()

async def run_seed_poll_task(ctx: dict, test_id: str) -> None:
    db = SessionLocal()
    try:
        test = db.query(SeedTest).filter(SeedTest.id == test_id).first()
        if not test or test.status in ["completed", "failed"]: return
            
        placements = check_seed_placement(test.subject_hint, test.created_at)
        now_utc = datetime.now(timezone.utc)
        test_created = test.created_at.replace(tzinfo=timezone.utc) if test.created_at.tzinfo is None else test.created_at
        time_elapsed = (now_utc - test_created).total_seconds()
        
        db.query(SeedTestResult).filter(SeedTestResult.seed_test_id == test.id).delete()
        for p in placements:
            db.add(SeedTestResult(seed_test_id=test.id, provider=p["provider"], placement=p["placement"]))
            
        missing = [p for p in placements if p["placement"] == "missing"]
        if not missing or time_elapsed > 3600:
            test.status = "completed"
        else:
            await ctx['redis'].enqueue_job("run_seed_poll_task", test_id, _defer_by=15)
        
        db.commit()
    finally:
        db.close()

class WorkerSettings:
    functions = [run_dns_check_task, run_blacklist_check_task, run_seed_poll_task]
    redis_settings = redis_settings
