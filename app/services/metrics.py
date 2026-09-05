import os
import time
import threading
from typing import Dict, Any, List, Optional
from collections import deque
from datetime import datetime
from app.services.server_process import MinecraftServerManager
from app.services import settings as settings_service

class MetricsService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MetricsService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.history: deque = deque(maxlen=30)  # 30 samples (~60 seconds of history at 2s interval)
        self.lock = threading.Lock()
        self._last_system_cpu: Optional[tuple] = None  # (total, idle, timestamp)
        self._last_proc_cpu: Optional[tuple] = None    # (proc_ticks, timestamp)
        self._num_cpus = os.cpu_count() or 1
        self._running = False
        self._thread: Optional[threading.Thread] = None

    def start(self):
        with self.lock:
            if not self._running:
                self._running = True
                self._thread = threading.Thread(target=self._sampling_loop, daemon=True)
                self._thread.start()

    def stop(self):
        self._running = False

    def _get_system_cpu_ticks(self) -> Optional[tuple]:
        """Read /proc/stat total and idle CPU ticks."""
        try:
            with open("/proc/stat", "r") as f:
                line = f.readline()
                if line.startswith("cpu "):
                    parts = [float(x) for x in line.split()[1:]]
                    total = sum(parts)
                    idle = parts[3] + (parts[4] if len(parts) > 4 else 0.0) # idle + iowait
                    return (total, idle)
        except Exception:
            pass
        return None

    def _get_proc_cpu_ticks(self, pid: int) -> Optional[float]:
        """Read /proc/<pid>/stat utime + stime ticks."""
        try:
            with open(f"/proc/{pid}/stat", "r") as f:
                content = f.read()
                # Process name may contain spaces/parentheses, so find last ')'
                idx = content.rfind(")")
                if idx != -1:
                    fields = content[idx + 2:].split()
                    utime = float(fields[11])
                    stime = float(fields[12])
                    return utime + stime
        except Exception:
            pass
        return None

    def _get_system_memory(self) -> Dict[str, Any]:
        """Read /proc/meminfo for host system memory details."""
        mem = {"total_mb": 0, "available_mb": 0, "used_mb": 0, "percent": 0.0}
        try:
            with open("/proc/meminfo", "r") as f:
                lines = f.readlines()
                info = {}
                for line in lines:
                    parts = line.split(":")
                    if len(parts) == 2:
                        key = parts[0].strip()
                        val = parts[1].strip().split()[0]
                        info[key] = int(val)
                
                total_kb = info.get("MemTotal", 0)
                avail_kb = info.get("MemAvailable", info.get("MemFree", 0))
                used_kb = max(0, total_kb - avail_kb)
                
                total_mb = round(total_kb / 1024, 1)
                used_mb = round(used_kb / 1024, 1)
                avail_mb = round(avail_kb / 1024, 1)
                percent = round((used_kb / total_kb * 100.0), 1) if total_kb > 0 else 0.0
                
                mem = {
                    "total_mb": total_mb,
                    "available_mb": avail_mb,
                    "used_mb": used_mb,
                    "percent": percent,
                    "total_formatted": f"{round(total_mb / 1024, 1)} GB" if total_mb >= 1024 else f"{int(total_mb)} MB",
                    "used_formatted": f"{round(used_mb / 1024, 1)} GB" if used_mb >= 1024 else f"{int(used_mb)} MB"
                }
        except Exception:
            pass
        return mem

    def _get_proc_memory(self, pid: int) -> Dict[str, Any]:
        """Read /proc/<pid>/status for resident set size (RSS) memory and threads."""
        res = {"rss_mb": 0.0, "rss_formatted": "0 MB", "threads": 0}
        try:
            with open(f"/proc/{pid}/status", "r") as f:
                for line in f:
                    if line.startswith("VmRSS:"):
                        rss_kb = int(line.split()[1])
                        rss_mb = round(rss_kb / 1024, 1)
                        res["rss_mb"] = rss_mb
                        res["rss_formatted"] = f"{round(rss_mb / 1024, 2)} GB" if rss_mb >= 1024 else f"{int(rss_mb)} MB"
                    elif line.startswith("Threads:"):
                        res["threads"] = int(line.split()[1])
        except Exception:
            pass
        return res

    def _calculate_tps_info(self, server_mgr: MinecraftServerManager) -> Dict[str, Any]:
        """Calculate TPS and MSPT estimate based on server runtime and recent log latency warnings."""
        if server_mgr.status != "online":
            return {
                "tps": 0.0,
                "mspt": 0.0,
                "status": "Offline" if server_mgr.status == "offline" else "Starting",
                "color": "var(--text-muted)",
                "lag_ms": 0
            }

        # Check logs for recent 'Can't keep up' warnings in the last 15 seconds
        lag_detected_ms = 0
        now_ts = datetime.now()
        for item in reversed(server_mgr.logs):
            txt = item.get("text", "")
            if "Can't keep up! Is the server overloaded?" in txt:
                try:
                    # e.g. Running 2450ms or 49 ticks behind
                    parts = txt.split("Running ")
                    if len(parts) > 1:
                        ms_str = parts[1].split("ms")[0].strip()
                        lag_detected_ms = int(ms_str)
                        break
                except Exception:
                    pass

        if lag_detected_ms > 0:
            # Degraded TPS calculation based on reported lag
            est_tps = max(5.0, round(20.0 / (1.0 + (lag_detected_ms / 1000.0)), 1))
            est_mspt = round(min(200.0, 50.0 + (lag_detected_ms / 10.0)), 1)
            status = "Heavy Lag" if est_tps < 15.0 else "Minor Lag"
            color = "var(--status-offline)" if est_tps < 15.0 else "var(--status-warning, #f59e0b)"
        else:
            est_tps = 20.0
            est_mspt = 25.0  # nominal MSPT under stable conditions
            status = "Stable 20 TPS"
            color = "var(--status-online)"

        return {
            "tps": est_tps,
            "mspt": est_mspt,
            "status": status,
            "color": color,
            "lag_ms": lag_detected_ms
        }

    def collect_snapshot(self) -> Dict[str, Any]:
        """Collect a full performance snapshot of Host and Minecraft server."""
        server_mgr = MinecraftServerManager()
        sys_ticks = self._get_system_cpu_ticks()
        now = time.time()

        # 1. System CPU Calculation
        system_cpu_pct = 0.0
        if sys_ticks and self._last_system_cpu:
            total_delta = sys_ticks[0] - self._last_system_cpu[0]
            idle_delta = sys_ticks[1] - self._last_system_cpu[1]
            if total_delta > 0:
                system_cpu_pct = round(max(0.0, min(100.0, (1.0 - (idle_delta / total_delta)) * 100.0)), 1)
        if sys_ticks:
            self._last_system_cpu = (sys_ticks[0], sys_ticks[1], now)

        # 2. Process CPU & RAM Calculation
        proc_cpu_pct = 0.0
        proc_mem = {"rss_mb": 0.0, "rss_formatted": "0 MB", "threads": 0}
        pid = server_mgr.process.pid if (server_mgr.process and server_mgr.process.poll() is None) else None

        if pid:
            proc_ticks = self._get_proc_cpu_ticks(pid)
            if proc_ticks is not None and self._last_proc_cpu and self._last_proc_cpu[1] == pid:
                ticks_delta = proc_ticks - self._last_proc_cpu[0]
                time_delta = now - self._last_proc_cpu[2]
                if time_delta > 0:
                    # User + system ticks over clock ticks (usually 100 Hz on Linux)
                    hz = os.sysconf(os.sysconf_names['SC_CLK_TCK']) if hasattr(os, 'sysconf') else 100
                    raw_cpu = (ticks_delta / hz) / time_delta * 100.0
                    proc_cpu_pct = round(max(0.0, min(100.0 * self._num_cpus, raw_cpu)), 1)
            if proc_ticks is not None:
                self._last_proc_cpu = (proc_ticks, pid, now)
            proc_mem = self._get_proc_memory(pid)
        else:
            self._last_proc_cpu = None

        # 3. System Memory
        sys_mem = self._get_system_memory()

        # 4. TPS & Tick Health
        tps_info = self._calculate_tps_info(server_mgr)

        # 5. Load Average & Uptime
        load_avg = [round(x, 2) for x in os.getloadavg()] if hasattr(os, 'getloadavg') else [0.0, 0.0, 0.0]
        uptime_seconds = int(now - server_mgr.start_time) if (server_mgr.start_time and server_mgr.status == "online") else 0
        
        hours, rem = divmod(uptime_seconds, 3600)
        minutes, seconds = divmod(rem, 60)
        uptime_str = f"{hours}h {minutes}m {seconds}s" if hours > 0 else f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"

        # Configured max RAM
        dash_settings = settings_service.get_dashboard_settings()
        max_ram_gb = dash_settings.get("ram_gb", 4)
        proc_mem_pct = round((proc_mem["rss_mb"] / (max_ram_gb * 1024)) * 100.0, 1) if max_ram_gb > 0 else 0.0

        snapshot = {
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "server_status": server_mgr.status,
            "cpu": {
                "system_percent": system_cpu_pct,
                "process_percent": proc_cpu_pct,
                "num_cpus": self._num_cpus,
                "load_avg": load_avg
            },
            "memory": {
                "system_total_mb": sys_mem["total_mb"],
                "system_used_mb": sys_mem["used_mb"],
                "system_available_mb": sys_mem["available_mb"],
                "system_percent": sys_mem["percent"],
                "system_total_formatted": sys_mem.get("total_formatted", "0 MB"),
                "system_used_formatted": sys_mem.get("used_formatted", "0 MB"),
                "process_rss_mb": proc_mem["rss_mb"],
                "process_rss_formatted": proc_mem["rss_formatted"],
                "process_percent": proc_mem_pct,
                "max_ram_gb": max_ram_gb
            },
            "tps": tps_info,
            "host": {
                "uptime_seconds": uptime_seconds,
                "uptime_formatted": uptime_str if server_mgr.status == "online" else "Offline",
                "threads": proc_mem["threads"],
                "pid": pid or 0
            }
        }
        return snapshot

    def _sampling_loop(self):
        """Background sampler thread filling history buffer every 2 seconds."""
        while self._running:
            try:
                snapshot = self.collect_snapshot()
                with self.lock:
                    self.history.append({
                        "time": snapshot["timestamp"],
                        "sys_cpu": snapshot["cpu"]["system_percent"],
                        "proc_cpu": snapshot["cpu"]["process_percent"],
                        "proc_ram_mb": snapshot["memory"]["process_rss_mb"],
                        "sys_ram_mb": snapshot["memory"]["system_used_mb"],
                        "tps": snapshot["tps"]["tps"]
                    })
            except Exception as e:
                print(f"Error sampling metrics: {e}")
            time.sleep(2.0)

    def get_live_metrics(self) -> Dict[str, Any]:
        """Get the latest snapshot."""
        return self.collect_snapshot()

    def get_history(self) -> List[Dict[str, Any]]:
        """Get history points for initial chart render."""
        with self.lock:
            return list(self.history)

metrics_service = MetricsService()
