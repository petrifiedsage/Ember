import smtplib
from email.mime.text import MIMEText
import httpx
from app.config import settings
from app.db.session import SessionLocal
from app.models.alert_rule import AlertRule
from app.models.domain import Domain

def evaluate_and_alert(domain_id: str, new_score: int, old_score: int):
    db = SessionLocal()
    try:
        rules = db.query(AlertRule).filter(AlertRule.domain_id == domain_id, AlertRule.is_active == True).all()
        domain = db.query(Domain).filter(Domain.id == domain_id).first()
        domain_name = domain.domain if domain else domain_id
        
        for rule in rules:
            trigger = False
            if rule.condition == "score_drops_below" and new_score < rule.threshold and old_score >= rule.threshold:
                trigger = True
                
            if trigger:
                if rule.channel == "email":
                    send_email_alert(rule.target, domain_name, new_score)
                elif rule.channel == "webhook":
                    send_webhook_alert(rule.target, domain_name, new_score)
    finally:
        db.close()

def send_email_alert(to_email: str, domain_name: str, score: int):
    msg = MIMEText(f"Alert! Domain {domain_name} health score dropped to {score}.")
    msg['Subject'] = f'Ember Alert: {domain_name} Reputation Drop'
    msg['From'] = settings.smtp_from_email
    msg['To'] = to_email

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
            print(f"Sent email alert to {to_email}")
    except Exception as e:
        print(f"Failed to send email alert: {e}")

def send_webhook_alert(url: str, domain_name: str, score: int):
    try:
        httpx.post(url, json={"text": f"Alert! Domain {domain_name} health score dropped to {score}."})
        print(f"Sent webhook alert to {url}")
    except Exception as e:
        print(f"Failed to send webhook alert: {e}")
