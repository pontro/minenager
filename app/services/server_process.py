import os
import subprocess
import threading
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
from collections import deque
from datetime import datetime
from app.services import settings as settings_service

MINECRAFT_DIR = Path("/data/minecraft")

class MinecraftServerManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MinecraftServerManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.process: Optional[subprocess.Popen] = None
        self.status: str = "offline"  # offline, starting, online, stopping
        self.logs: deque = deque(maxlen=2000)
        self.start_time: Optional[float] = None
        self.lock = threading.Lock()
        self._reader_thread: Optional[threading.Thread] = None

    def _append_log(self, text: str):
        line = text.rstrip("\r\n")
        if line:
            self.logs.append({
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "text": line
            })

    def _read_stdout(self):
        """Background thread to read server stdout line by line."""
        try:
            if not self.process or not self.process.stdout:
                return

            for line in iter(self.process.stdout.readline, ''):
                if not line and self.process.poll() is not None:
                    break
                self._append_log(line)

                # Detect when server is fully loaded and online
                if self.status == "starting" and ("Done (" in line or "For help, type \"help\"" in line):
                    with self.lock:
                        self.status = "online"

            self.process.stdout.close()
        except Exception as e:
            self._append_log(f"[Minenager] Error reading server output: {e}")
        finally:
            with self.lock:
                if self.process:
                    self.process.poll()
                self.status = "offline"
                self.start_time = None
                self._append_log("[Minenager] Minecraft server process has stopped.")

    def start(self) -> Dict[str, Any]:
        with self.lock:
            # Check if already running
            if self.process and self.process.poll() is None:
                return {"success": False, "message": "Server is already running.", "status": self.status}

            server_jar = MINECRAFT_DIR / "server.jar"
            if not server_jar.exists():
                raise Exception("server.jar not found in /data/minecraft/. Please install Minecraft or upload a modpack first.")

            # Auto-accept EULA & ensure ports
            eula_file = MINECRAFT_DIR / "eula.txt"
            if not eula_file.exists():
                with open(eula_file, "w") as f:
                    f.write("eula=true\n")

            # Load configured RAM settings
            dash_settings = settings_service.get_dashboard_settings()
            ram_gb = dash_settings.get("ram_gb", 4)
            min_ram_gb = dash_settings.get("min_ram_gb", 1)
            java_args = dash_settings.get("java_args", "").strip()

            # Build java start command
            cmd = [
                "java",
                f"-Xms{min_ram_gb}G",
                f"-Xmx{ram_gb}G"
            ]
            if java_args:
                cmd.extend(java_args.split())
            cmd.extend(["-jar", "server.jar", "nogui"])

            self._append_log(f"[Minenager] Starting Minecraft server with command: {' '.join(cmd)}")
            self.status = "starting"
            self.start_time = time.time()

            try:
                self.process = subprocess.Popen(
                    cmd,
                    cwd=str(MINECRAFT_DIR),
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                    universal_newlines=True
                )
            except Exception as e:
                self.status = "offline"
                self.start_time = None
                raise Exception(f"Failed to execute java process: {e}")

            # Start background reader thread
            self._reader_thread = threading.Thread(target=self._read_stdout, daemon=True)
            self._reader_thread.start()

            return {
                "success": True,
                "status": self.status,
                "ram_allocated": f"{ram_gb} GB",
                "pid": self.process.pid
            }

    def stop(self, timeout: int = 30) -> Dict[str, Any]:
        with self.lock:
            if not self.process or self.process.poll() is not None:
                self.status = "offline"
                return {"success": True, "message": "Server is already offline.", "status": "offline"}

            self.status = "stopping"
            self._append_log("[Minenager] Sending 'stop' command to Minecraft server...")

            try:
                if self.process.stdin:
                    self.process.stdin.write("stop\n")
                    self.process.stdin.flush()
            except Exception as e:
                self._append_log(f"[Minenager] Could not send stop command: {e}")

        # Wait for graceful shutdown in a background thread
        def _wait_and_kill():
            try:
                self.process.wait(timeout=timeout)
            except subprocess.TimeoutExpired:
                self._append_log("[Minenager] Server did not stop in time. Force killing process...")
                try:
                    self.process.kill()
                except Exception:
                    pass
            with self.lock:
                self.status = "offline"
                self.start_time = None

        threading.Thread(target=_wait_and_kill, daemon=True).start()

        return {"success": True, "status": "stopping"}

    def restart(self) -> Dict[str, Any]:
        if self.process and self.process.poll() is None:
            self.stop()
            # Wait briefly then start
            def _delayed_start():
                if self.process:
                    try:
                        self.process.wait(timeout=30)
                    except Exception:
                        pass
                time.sleep(1)
                self.start()

            threading.Thread(target=_delayed_start, daemon=True).start()
            return {"success": True, "status": "restarting"}
        else:
            return self.start()

    def send_command(self, cmd: str) -> Dict[str, Any]:
        if not self.process or self.process.poll() is not None:
            raise Exception("Cannot send command: Server is offline.")

        clean_cmd = cmd.strip()
        if clean_cmd.startswith("/"):
            clean_cmd = clean_cmd[1:]

        try:
            if self.process.stdin:
                self.process.stdin.write(clean_cmd + "\n")
                self.process.stdin.flush()
                self._append_log(f"> {clean_cmd}")
                return {"success": True, "command": clean_cmd}
            raise Exception("Stdin stream not available.")
        except Exception as e:
            raise Exception(f"Failed to write to server stdin: {e}")

    def get_status(self) -> Dict[str, Any]:
        # Check if process died
        if self.process:
            poll = self.process.poll()
            if poll is not None and self.status not in ["offline"]:
                self.status = "offline"
                self.start_time = None

        uptime_seconds = 0
        if self.start_time and self.status in ["online", "starting"]:
            uptime_seconds = int(time.time() - self.start_time)

        dash_settings = settings_service.get_dashboard_settings()

        return {
            "status": self.status,
            "pid": self.process.pid if self.process and self.process.poll() is None else None,
            "uptime_seconds": uptime_seconds,
            "ram_allocated": f"{dash_settings.get('ram_gb', 4)} GB"
        }

    def get_logs(self, start_index: int = 0) -> Dict[str, Any]:
        all_logs = list(self.logs)
        total = len(all_logs)
        if start_index >= total:
            return {"logs": [], "total_count": total}
        return {
            "logs": all_logs[start_index:],
            "total_count": total
        }

server_manager = MinecraftServerManager()
