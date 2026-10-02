import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

DATA_DIR = Path("/data/minecraft")
LICENSE_FILE = DATA_DIR / "account.json"

def get_account_status() -> Dict[str, Any]:
    """Retrieve the current account and license status."""
    if not LICENSE_FILE.exists():
        return {
            "logged_in": False,
            "email": None,
            "tier": "free",
            "is_pro": False,
            "subdomain": None,
            "token": None
        }

    try:
        with open(LICENSE_FILE, "r") as f:
            data = json.load(f)
            return {
                "logged_in": data.get("logged_in", True),
                "email": data.get("email"),
                "tier": data.get("tier", "free"),
                "is_pro": data.get("tier") == "pro",
                "subdomain": data.get("subdomain"),
                "token": data.get("token")
            }
    except Exception as e:
        return {
            "logged_in": False,
            "email": None,
            "tier": "free",
            "is_pro": False,
            "subdomain": None,
            "token": None,
            "error": str(e)
        }

def save_account_session(email: str, tier: str = "pro", subdomain: Optional[str] = None, token: Optional[str] = None) -> Dict[str, Any]:
    """Save user account and license state locally."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    session_data = {
        "logged_in": True,
        "email": email,
        "tier": tier,
        "subdomain": subdomain or f"{email.split('@')[0].lower()}-smp",
        "token": token or "simulated_jwt_token",
        "updated_at": datetime.utcnow().isoformat()
    }
    with open(LICENSE_FILE, "w") as f:
        json.dump(session_data, f, indent=2)

    return get_account_status()

def clear_account_session() -> Dict[str, Any]:
    """Log out and reset to free tier."""
    if LICENSE_FILE.exists():
        try:
            LICENSE_FILE.unlink()
        except Exception:
            pass
    return get_account_status()
