import os
import subprocess
import threading
import time
from pathlib import Path
from typing import Dict, Any, Optional
from app.services import license as license_service

FRPC_BINARY = Path("/code/app/bin/frpc")
CONFIG_DIR = Path("/data/minecraft")
FRPC_CONFIG_FILE = CONFIG_DIR / "frpc.toml"

class TunnelManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TunnelManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.process: Optional[subprocess.Popen] = None
        self.is_running: bool = False
        self.public_address: Optional[str] = None
        self.subdomain: Optional[str] = None
        self.public_port: Optional[int] = None
        self.last_error: Optional[str] = None
        self.lock = threading.Lock()
        self._log_thread: Optional[threading.Thread] = None

    def get_status(self) -> Dict[str, Any]:
        """Returns the current status of the tunnel agent."""
        with self.lock:
            if self.process:
                poll = self.process.poll()
                if poll is not None:
                    self.is_running = False
                    self.process = None

            return {
                "active": self.is_running,
                "public_address": self.public_address if self.is_running else None,
                "subdomain": self.subdomain,
                "public_port": self.public_port,
                "error": self.last_error
            }

    def start(self, local_port: int = 25565) -> Dict[str, Any]:
        """Starts the reverse tunnel if user is Pro and tunnel config is available."""
        with self.lock:
            if self.process and self.process.poll() is None:
                return {"success": True, "message": "Tunnel is already running.", "public_address": self.public_address}

            self.last_error = None
            account = license_service.get_account_status()
            if not account.get("logged_in") or not account.get("is_pro"):
                return {"success": False, "message": "Tunnel requires Minenager Pro."}

            if not FRPC_BINARY.exists():
                self.last_error = f"Tunnel binary not found at {FRPC_BINARY}"
                print(f"[Minenager Tunnel] {self.last_error}")
                return {"success": False, "message": self.last_error}

            tunnel_cfg = license_service.get_cloud_tunnel_config()
            if not tunnel_cfg:
                self.last_error = "Could not fetch tunnel configuration from Cloud API."
                print(f"[Minenager Tunnel] {self.last_error}")
                return {"success": False, "message": self.last_error}

            relay_host = tunnel_cfg.get("relay_server_host", "127.0.0.1")
            relay_port = tunnel_cfg.get("relay_server_port", 2333)
            relay_token = tunnel_cfg.get("relay_auth_token", "")
            remote_port = tunnel_cfg.get("public_port")
            subdomain = tunnel_cfg.get("subdomain", "server")
            proxy_name = f"mc-{subdomain}"

            if relay_host in ["127.0.0.1", "localhost"]:
                server_addr = "host.docker.internal"
            else:
                server_addr = relay_host

            CONFIG_DIR.mkdir(parents=True, exist_ok=True)
            config_content = f"""# Minenager Pro Client Tunnel Configuration
serverAddr = "{server_addr}"
serverPort = {relay_port}
auth.token = "{relay_token}"

[[proxies]]
name = "{proxy_name}"
type = "tcp"
localIP = "127.0.0.1"
localPort = {local_port}
remotePort = {remote_port}
"""
            with open(FRPC_CONFIG_FILE, "w") as cfg_f:
                cfg_f.write(config_content)

            try:
                cmd = [str(FRPC_BINARY), "-c", str(FRPC_CONFIG_FILE)]
                self.process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1
                )
                self.is_running = True
                self.subdomain = subdomain
                self.public_port = remote_port
                self.public_address = tunnel_cfg.get("public_address", f"{subdomain}:{remote_port}")

                def _monitor_logs():
                    try:
                        for line in iter(self.process.stdout.readline, ''):
                            if not line and self.process.poll() is not None:
                                break
                            clean_line = line.strip()
                            if clean_line:
                                print(f"[Minenager Tunnel] {clean_line}")
                        self.process.stdout.close()
                    except Exception as e:
                        print(f"[Minenager Tunnel Monitor Error] {e}")
                    finally:
                        with self.lock:
                            self.is_running = False

                self._log_thread = threading.Thread(target=_monitor_logs, daemon=True)
                self._log_thread.start()

                print(f"[Minenager Tunnel] Started reverse tunnel: {self.public_address} -> 127.0.0.1:{local_port}")
                return {
                    "success": True,
                    "public_address": self.public_address,
                    "public_port": self.public_port
                }

            except Exception as e:
                self.is_running = False
                self.process = None
                self.last_error = str(e)
                print(f"[Minenager Tunnel] Failed to start tunnel process: {e}")
                return {"success": False, "message": str(e)}

    def stop(self) -> Dict[str, Any]:
        """Stops the reverse tunnel process cleanly."""
        with self.lock:
            if not self.process or self.process.poll() is not None:
                self.is_running = False
                self.process = None
                return {"success": True, "message": "Tunnel is already stopped."}

            try:
                print("[Minenager Tunnel] Stopping reverse tunnel process...")
                self.process.terminate()
                try:
                    self.process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    self.process.kill()
            except Exception as e:
                print(f"[Minenager Tunnel] Error stopping process: {e}")
            finally:
                self.is_running = False
                self.process = None

            return {"success": True, "message": "Tunnel stopped."}

tunnel_manager = TunnelManager()
