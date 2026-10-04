import json
import os
import hashlib
import secrets
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

DATA_DIR = Path("/data/minecraft")
SESSION_FILE = DATA_DIR / "session.json"
ACCOUNTS_FILE = DATA_DIR / "accounts.json"

def _hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Generate salted sha256 hash."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return hashed, salt

def _verify_password(password: str, hashed: str, salt: str) -> bool:
    """Verify password against stored salt and hash."""
    test_hash, _ = _hash_password(password, salt)
    return secrets.compare_digest(test_hash, hashed)

def _load_accounts() -> Dict[str, Any]:
    if not ACCOUNTS_FILE.exists():
        return {}
    try:
        with open(ACCOUNTS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_accounts(accounts: Dict[str, Any]):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(ACCOUNTS_FILE, "w") as f:
        json.dump(accounts, f, indent=2)

def register_account(username: str, email: str, password: str) -> Dict[str, Any]:
    """Register a new local account and create a session."""
    username = username.strip().lower()
    email = email.strip().lower()
    accounts = _load_accounts()

    if username in accounts:
        raise ValueError("Username is already taken.")
    
    for _, acc in accounts.items():
        if acc.get("email") == email:
            raise ValueError("Email is already registered.")

    hashed, salt = _hash_password(password)
    accounts[username] = {
        "username": username,
        "email": email,
        "password_hash": hashed,
        "salt": salt,
        "tier": "free",
        "created_at": datetime.utcnow().isoformat()
    }
    _save_accounts(accounts)

    return _create_session(username, accounts[username])

def authenticate_account(identifier: str, password: str) -> Dict[str, Any]:
    """Authenticate via username or email and return session."""
    identifier = identifier.strip().lower()
    accounts = _load_accounts()

    target_user = None
    target_username = None

    if identifier in accounts:
        target_user = accounts[identifier]
        target_username = identifier
    else:
        for u, acc in accounts.items():
            if acc.get("email") == identifier:
                target_user = acc
                target_username = u
                break

    if not target_user:
        raise ValueError("Account not found.")

    if not _verify_password(password, target_user.get("password_hash", ""), target_user.get("salt", "")):
        raise ValueError("Invalid password.")

    return _create_session(target_username, target_user)

def _create_session(username: str, account_data: Dict[str, Any]) -> Dict[str, Any]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    session_data = {
        "logged_in": True,
        "username": username,
        "email": account_data.get("email", ""),
        "tier": account_data.get("tier", "free"),
        "subdomain": f"{username}-smp",
        "token": secrets.token_hex(24),
        "logged_in_at": datetime.utcnow().isoformat()
    }
    with open(SESSION_FILE, "w") as f:
        json.dump(session_data, f, indent=2)

    return get_account_status()

def activate_license(license_key: str) -> Dict[str, Any]:
    """Activate a Minenager Pro license key for the currently logged-in account."""
    status = get_account_status()
    if not status.get("logged_in"):
        raise ValueError("You must be logged in to activate a license.")

    key = license_key.strip().upper()
    if not key or len(key) < 8:
        raise ValueError("Invalid license key format.")

    # Upgrade the stored account
    accounts = _load_accounts()
    username = status.get("username")
    if username in accounts:
        accounts[username]["tier"] = "pro"
        accounts[username]["license_key"] = key
        accounts[username]["pro_activated_at"] = datetime.utcnow().isoformat()
        _save_accounts(accounts)

    # Update session
    if SESSION_FILE.exists():
        with open(SESSION_FILE, "r") as f:
            session = json.load(f)
        session["tier"] = "pro"
        with open(SESSION_FILE, "w") as f:
            json.dump(session, f, indent=2)

    return get_account_status()

def get_account_status() -> Dict[str, Any]:
    """Retrieve the current account and license status."""
    if not SESSION_FILE.exists():
        return {
            "logged_in": False,
            "username": None,
            "email": None,
            "tier": "none",
            "is_pro": False,
            "subdomain": None,
            "token": None
        }

    try:
        with open(SESSION_FILE, "r") as f:
            data = json.load(f)
            tier = data.get("tier", "free")
            return {
                "logged_in": data.get("logged_in", False),
                "username": data.get("username"),
                "email": data.get("email"),
                "tier": tier,
                "is_pro": tier == "pro",
                "subdomain": data.get("subdomain"),
                "token": data.get("token")
            }
    except Exception as e:
        return {
            "logged_in": False,
            "username": None,
            "email": None,
            "tier": "none",
            "is_pro": False,
            "subdomain": None,
            "token": None,
            "error": str(e)
        }

def clear_account_session() -> Dict[str, Any]:
    """Log out and reset session."""
    if SESSION_FILE.exists():
        try:
            SESSION_FILE.unlink()
        except Exception:
            pass
    return get_account_status()

