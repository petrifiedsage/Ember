import smtplib
from email.mime.text import MIMEText
import httpx
import logging
from app.config import settings
from app.db.session import SessionLocal
from app.models.alert_rule import AlertRule
from app.models.domain import Domain

logger = logging.getLogger(__name__)

def evaluate_and_alert(domain_id: str, new_score: int, old_score: int, has_blacklist_hit: bool = False):
    db = SessionLocal()
    try:
        rules = db.query(AlertRule).filter(AlertRule.domain_id == domain_id, AlertRule.is_active == True).all()
        domain = db.query(Domain).filter(Domain.id == domain_id).first()
        domain_name = domain.domain if domain else domain_id
        
        for rule in rules:
            trigger = False
            # For score_below: trigger if score drops below threshold OR if already below and this is first alert
            if rule.condition == "score_below" and new_score < rule.threshold:
                # Either it's a transition (old_score was >= threshold) or first time (never fired)
                if old_score >= rule.threshold or rule.last_fired_at is None:
                    trigger = True
            elif rule.condition == "blacklist_hit" and has_blacklist_hit:
                trigger = True
                
            if trigger:
                from datetime import datetime, timezone
                now = datetime.now(timezone.utc)
                # Debounce alerts (don't spam if already fired recently, e.g. within 24 hours)
                if rule.last_fired_at is None or (now - rule.last_fired_at.replace(tzinfo=timezone.utc)).total_seconds() > 86400:
                    logger.info(f"Alert triggered for domain {domain_name}: condition={rule.condition}, new_score={new_score}, threshold={rule.threshold}, last_fired={rule.last_fired_at}")
                    if rule.channel == "email":
                        send_email_alert(rule.target, domain_name, new_score)
                    elif rule.channel == "webhook":
                        send_webhook_alert(rule.target, domain_name, new_score)
                    rule.last_fired_at = now
                else:
                    logger.debug(f"Alert debounced for domain {domain_name}: condition={rule.condition}, last_fired={rule.last_fired_at}")
        db.commit()
    finally:
        db.close()

def send_email_alert(to_email: str, domain_name: str, score: int):
    msg = MIMEText(f"Alert! Domain {domain_name} health score dropped to {score}.")
    msg['Subject'] = f'Ember Alert: {domain_name} Reputation Drop'
    msg['From'] = settings.smtp_from_email
    msg['To'] = to_email

    logger.info(f"Attempting to send alert email to {to_email} via {settings.smtp_host}:{settings.smtp_port}")
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            logger.info(f"Connected to SMTP server {settings.smtp_host}:{settings.smtp_port}")
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
                logger.info("Authenticated with SMTP server")
            server.send_message(msg)
            logger.info(f"✓ Sent email alert to {to_email} for domain {domain_name} (score: {score})")
            print(f"✓ Sent email alert to {to_email}")
    except Exception as e:
        logger.error(f"✗ Failed to send email alert to {to_email}: {type(e).__name__}: {e}")
        print(f"✗ Failed to send email alert: {e}")

def send_webhook_alert(url: str, domain_name: str, score: int):
    logger.info(f"Attempting to send webhook alert to {url} for domain {domain_name}")
    try:
        response = httpx.post(url, json={"text": f"Alert! Domain {domain_name} health score dropped to {score}."})
        logger.info(f"✓ Sent webhook alert to {url}, status: {response.status_code}")
        print(f"✓ Sent webhook alert to {url}")
    except Exception as e:
        logger.error(f"✗ Failed to send webhook alert to {url}: {type(e).__name__}: {e}")
        print(f"✗ Failed to send webhook alert: {e}")
