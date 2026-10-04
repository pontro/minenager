import json
import os
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

DATA_DIR = Path("/data/minecraft")
SESSION_FILE = DATA_DIR / "session.json"
CLOUD_API_URL = os.getenv("CLOUD_API_URL", "http://host.docker.internal:8080/api/v1")

def _call_cloud_api(endpoint: str, method: str = "GET", data: Optional[Dict[str, Any]] = None, token: Optional[str] = None) -> Dict[str, Any]:
    url = f"{CLOUD_API_URL}{endpoint}"
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Minenager-Desktop/1.0"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_detail = "Request failed"
        try:
            err_body = json.loads(e.read().decode("utf-8"))
            error_detail = err_body.get("detail", str(e))
        except Exception:
            pass
        raise ValueError(error_detail)
    except Exception as e:
        raise ValueError(f"Unable to connect to Minenager Cloud ({str(e)})")

def register_account(username: str, email: str, password: str) -> Dict[str, Any]:
    """Register account on Central Cloud API and save returned session."""
    res = _call_cloud_api(
        endpoint="/auth/register",
        method="POST",
        data={
            "username": username,
            "email": email,
            "password": password
        }
    )
    user_info = res.get("user", {})
    return _save_cloud_session(
        token=res.get("access_token"),
        user_info=user_info
    )

def authenticate_account(identifier: str, password: str) -> Dict[str, Any]:
    """Authenticate with Cloud API and save returned session."""
    res = _call_cloud_api(
        endpoint="/auth/login",
        method="POST",
        data={
            "username_or_email": identifier,
            "password": password
        }
    )
    user_info = res.get("user", {})
    return _save_cloud_session(
        token=res.get("access_token"),
        user_info=user_info
    )

def _save_cloud_session(token: str, user_info: Dict[str, Any]) -> Dict[str, Any]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    username = user_info.get("username", "user")
    session_data = {
        "logged_in": True,
        "token": token,
        "user_id": str(user_info.get("id")),
        "username": username,
        "email": user_info.get("email"),
        "tier": user_info.get("tier", "free"),
        "subdomain": f"{username}-smp",
        "logged_in_at": datetime.utcnow().isoformat()
    }
    with open(SESSION_FILE, "w") as f:
        json.dump(session_data, f, indent=2)

    return get_account_status()


def get_account_status() -> Dict[str, Any]:
    """Retrieve the current account status."""
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

def get_cloud_tunnel_config() -> Optional[Dict[str, Any]]:
    """Retrieve allocated tunnel settings from Cloud API for current authenticated Pro user."""
    status = get_account_status()
    if not status.get("logged_in") or not status.get("token"):
        return None
    try:
        return _call_cloud_api(endpoint="/tunnels/config", method="GET", token=status["token"])
    except Exception as e:
        print(f"[Minenager] Failed to fetch tunnel configuration: {e}")
        return None

def send_tunnel_heartbeat(tunnel_token: str, is_online: bool, peak_players: int = 0, bytes_in: int = 0, bytes_out: int = 0) -> bool:
    """Send periodic heartbeat & traffic stats for this tunnel to Minenager Cloud."""
    if not tunnel_token:
        return False
    try:
        _call_cloud_api(
            endpoint=f"/tunnels/status/{tunnel_token}",
            method="POST",
            data={
                "is_online": is_online,
                "peak_players": peak_players,
                "bytes_in": bytes_in,
                "bytes_out": bytes_out
            }
        )
        return True
    except Exception as e:
        print(f"[Minenager Tunnel Heartbeat] Error reporting heartbeat: {e}")
        return False

def get_billing_config() -> Dict[str, Any]:
    """Retrieve Stripe publishable key from Cloud API."""
    return _call_cloud_api(endpoint="/billing/config", method="GET")

def create_stripe_checkout_session() -> Dict[str, Any]:
    """Call Cloud API to generate an embedded Stripe Checkout Session."""
    status = get_account_status()
    if not status.get("logged_in") or not status.get("token"):
        raise ValueError("You must be logged in to subscribe to Minenager Pro.")
    return _call_cloud_api(
        endpoint="/billing/create-checkout-session",
        method="POST",
        token=status["token"]
    )

