import imaplib

try:
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login("antonymanjila1@gmail.com", "yfet imym jhqz xbgp")
    mail.select("INBOX")
    status, msgs = mail.search(None, 'ALL')
    print("INBOX MSG COUNT:", len(msgs[0].split()))
    
    mail.select('"[Gmail]/Spam"')
    status, msgs = mail.search(None, 'ALL')
    print("SPAM MSG COUNT:", len(msgs[0].split()))
except Exception as e:
    print(e)
