import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from arq import create_pool
from app.workers.queue import redis_settings
from app.db.session import SessionLocal
from app.models.domain import Domain

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()
redis_pool = None

async def enqueue_daily_checks():
    global redis_pool
    if not redis_pool:
        redis_pool = await create_pool(redis_settings)
    
    db = SessionLocal()
    try:
        domains = db.query(Domain).all()
        for domain in domains:
            logger.info(f"Enqueueing daily checks for domain {domain.domain}")
            await redis_pool.enqueue_job("run_dns_check_task", str(domain.id))
            await redis_pool.enqueue_job("run_blacklist_check_task", str(domain.id))
    finally:
        db.close()

scheduler.add_job(enqueue_daily_checks, 'cron', hour=6, minute=0)
