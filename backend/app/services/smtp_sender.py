import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_seed_test_email(
    smtp_host: str,
    smtp_port: int,
    smtp_username: str,
    smtp_password: str,
    sender_email: str,
    seed_addresses: list[str],
    subject: str,
    body_text: str = None,
    body_html: str = None
) -> None:
    """
    Connects to the user's SMTP relay and automatically dispatches the seed test email to all seed addresses.
    """
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender_email
    
    # We use BCC for the seed addresses to mimic a real campaign list
    # The 'To' field can just be the sender's own email.
    msg["To"] = sender_email
    msg["Bcc"] = ", ".join(seed_addresses)

    if not body_text and not body_html:
        body_text = "This is a deliverability test powered by Mailscope. If you are reading this, the test was successful."

    if body_text:
        msg.attach(MIMEText(body_text, "plain"))
        
    if body_html:
        msg.attach(MIMEText(body_html, "html"))

    try:
        # Use STARTTLS if port is 587, else assume SSL/TLS for 465
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            server.ehlo()
            server.starttls()
            server.ehlo()

        if smtp_username and smtp_password:
            server.login(smtp_username, smtp_password)

        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Failed to auto-send seed test email via {smtp_host}: {e}")
        raise ValueError(f"SMTP Error: {str(e)}")
