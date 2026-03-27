"""
Token encryption service for securely storing OAuth credentials.
"""
from cryptography.fernet import Fernet
from app.config import settings

def _get_cipher() -> Fernet:
    key = settings.ENCRYPTION_KEY
    if not key:
        raise ValueError("ENCRYPTION_KEY is not set in the environment")
    return Fernet(key.encode())

def encrypt_token(plaintext: str) -> str:
    """Encrypt a plaintext token using Fernet"""
    if not plaintext:
        return plaintext
        
    cipher = _get_cipher()
    # Ensure plaintext is bytes before encryption
    encrypted_bytes = cipher.encrypt(plaintext.encode())
    # Return as string for DB storage
    return encrypted_bytes.decode()

def decrypt_token(ciphertext: str) -> str:
    """Decrypt a Fernet ciphertext token"""
    if not ciphertext:
        return ciphertext
        
    cipher = _get_cipher()
    # Text from DB is string, Fernet needs bytes to decrypt
    decrypted_bytes = cipher.decrypt(ciphertext.encode())
    return decrypted_bytes.decode()
