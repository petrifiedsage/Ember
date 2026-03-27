import base64
import requests
from email.message import EmailMessage

class GmailClient:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {"Authorization": f"Bearer {self.access_token}"}
        
    def send_email(self, to: str, subject: str, body: str) -> dict:
        """Sends an email using the Gmail API"""
        message = EmailMessage()
        message.set_content(body)
        message["To"] = to
        message["Subject"] = subject
        
        # Gmail API requires urlsafe base64 string for the raw payload
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        payload = {"raw": encoded_message}
        
        response = requests.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers=self.headers,
            json=payload
        )
        if not response.ok:
            raise ValueError(f"Failed to send email via Gmail API: {response.text}")
            
        return response.json()
        
    def list_messages(self, query: str = "", max_results: int = 10) -> list:
        """Lists messages matching a specific query"""
        params = {"q": query, "maxResults": max_results}
        response = requests.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers=self.headers,
            params=params
        )
        if not response.ok:
            raise ValueError(f"Failed to list messages: {response.text}")
        return response.json().get("messages", [])
        
    def get_message(self, message_id: str) -> dict:
        """Gets full message details including headers"""
        response = requests.get(
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}?format=full",
            headers=self.headers
        )
        if not response.ok:
            raise ValueError(f"Failed to fetch message {message_id}: {response.text}")
        return response.json()
