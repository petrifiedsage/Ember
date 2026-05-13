import imaplib
import json
import os

SEED_ACCOUNTS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "seed_accounts.json")

def load_seed_accounts():
    if not os.path.exists(SEED_ACCOUNTS_FILE):
        return []
    with open(SEED_ACCOUNTS_FILE, "r") as f:
        return json.load(f)

def check_seed_placement(subject_hint: str, test_created_at) -> list:
    accounts = load_seed_accounts()
    results = []
    
    for account in accounts:
        provider = account.get("provider", "unknown")
        email_addr = account.get("email")
        password = account.get("password")
        imap_server = account.get("imap_server")
        imap_port = account.get("imap_port", 993)
        
        try:
            mail = imaplib.IMAP4_SSL(imap_server, imap_port)
            mail.login(email_addr, password)
            
            # Check INBOX
            mail.select("INBOX")
            status, messages = mail.search(None, f'(SUBJECT "{subject_hint}")')
            
            placement = "missing"
            
            if messages[0]:
                placement = "inbox"
            else:
                # Check Spam folder
                spam_folder = '"[Gmail]/Spam"' if provider == "gmail" else "Junk"
                try:
                    mail.select(spam_folder)
                    status, messages = mail.search(None, f'(SUBJECT "{subject_hint}")')
                    if messages[0]:
                        placement = "spam"
                except Exception:
                    pass
            
            mail.logout()
            results.append({
                "provider": provider,
                "email": email_addr,
                "placement": placement
            })
            
        except Exception as e:
            print(f"Failed to check IMAP for {email_addr}: {e}")
            results.append({
                "provider": provider,
                "email": email_addr,
                "placement": "error"
            })
            
    return results
