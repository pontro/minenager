import os
import time
import zipfile
import shutil
import threading
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta

try:
    from zoneinfo import ZoneInfo
except ImportError:
    ZoneInfo = None

MINECRAFT_DIR = Path("/data/minecraft")
BACKUPS_DIR = Path("/data/backups")
MAX_BACKUPS = 7

# State tracker for backup/restore in progress
backup_status = {
    "is_busy": False,
    "action": "idle", # "idle", "backing_up", "restoring"
    "message": "",
    "last_result": None
}

def get_mx_now() -> datetime:
    """Get current timestamp in Mexico City timezone (America/Mexico_City)."""
    if ZoneInfo:
        try:
            return datetime.now(ZoneInfo("America/Mexico_City"))
        except Exception:
            pass
    # Fallback UTC-6
    return datetime.now(timezone(timedelta(hours=-6)))

def get_level_name() -> str:
    """Read level-name from server.properties."""
    props_file = MINECRAFT_DIR / "server.properties"
    if props_file.exists():
        with open(props_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("level-name="):
                    return line.strip().split("=", 1)[1].strip() or "world"
    return "world"

def list_backups() -> List[Dict[str, Any]]:
    """List all available backups sorted newest first."""
    BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
    backups = []
    
    for item in BACKUPS_DIR.glob("*.zip"):
        if item.is_file():
            stat = item.stat()
            # Parse timestamp from file mod time or filename
            dt = datetime.fromtimestamp(stat.st_mtime, timezone.utc)
            if ZoneInfo:
                try:
                    dt = dt.astimezone(ZoneInfo("America/Mexico_City"))
                except Exception:
                    dt = dt.astimezone(timezone(timedelta(hours=-6)))
            else:
                dt = dt.astimezone(timezone(timedelta(hours=-6)))

            backups.append({
                "filename": item.name,
                "size_bytes": stat.st_size,
                "size_formatted": f"{round(stat.st_size / (1024 * 1024), 2)} MB" if stat.st_size >= 1024*1024 else f"{round(stat.st_size / 1024, 1)} KB",
                "created_at": dt.strftime("%Y-%m-%d %H:%M:%S (CDMX)"),
                "timestamp": stat.st_mtime
            })

    # Sort descending by creation timestamp
    backups.sort(key=lambda x: x["timestamp"], reverse=True)
    return backups

def cleanup_old_backups():
    """Keep only the last MAX_BACKUPS (7) backups."""
    backups = list_backups()
    if len(backups) > MAX_BACKUPS:
        # Delete extra oldest backups
        to_delete = backups[MAX_BACKUPS:]
        for b in to_delete:
            file_path = BACKUPS_DIR / b["filename"]
            try:
                if file_path.exists():
                    file_path.unlink()
            except Exception as e:
                print(f"Error removing old backup {file_path}: {e}")

def create_world_backup() -> Dict[str, Any]:
    """Create a .zip archive of the world folders."""
    BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
    level_name = get_level_name()
    now_mx = get_mx_now()
    time_str = now_mx.strftime("%Y-%m-%d_%H-%M-%S")
    zip_filename = f"backup_{time_str}.zip"
    zip_path = BACKUPS_DIR / zip_filename

    # Folders to backup: world, world_nether, world_the_end, DIM1, DIM-1
    target_dirs = [
        level_name,
        f"{level_name}_nether",
        f"{level_name}_the_end",
        "DIM1",
        "DIM-1"
    ]

    # Create zip archive
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for target in target_dirs:
            dir_path = MINECRAFT_DIR / target
            if dir_path.exists() and dir_path.is_dir():
                for root, _, files in os.walk(dir_path):
                    for file in files:
                        full_path = Path(root) / file
                        arcname = full_path.relative_to(MINECRAFT_DIR)
                        zipf.write(full_path, arcname)

    # Enforce maximum of 7 backups
    cleanup_old_backups()

    stat = zip_path.stat()
    return {
        "success": True,
        "filename": zip_filename,
        "size_bytes": stat.st_size,
        "created_at": now_mx.strftime("%Y-%m-%d %H:%M:%S (CDMX)")
    }

def restore_world_backup(filename: str) -> Dict[str, Any]:
    """Restore world folders from a backup zip."""
    clean_name = os.path.basename(filename)
    zip_path = BACKUPS_DIR / clean_name
    if not zip_path.exists():
        raise Exception(f"Backup file '{clean_name}' not found.")

    level_name = get_level_name()
    target_dirs = [
        level_name,
        f"{level_name}_nether",
        f"{level_name}_the_end",
        "DIM1",
        "DIM-1"
    ]

    # Delete current world folders
    for target in target_dirs:
        dir_path = MINECRAFT_DIR / target
        if dir_path.exists() and dir_path.is_dir():
            shutil.rmtree(dir_path)

    # Extract backup zip
    with zipfile.ZipFile(zip_path, "r") as zipf:
        zipf.extractall(MINECRAFT_DIR)

    return {
        "success": True,
        "message": f"Backup '{clean_name}' successfully restored."
    }

def delete_backup_file(filename: str) -> Dict[str, Any]:
    """Delete a single backup file."""
    clean_name = os.path.basename(filename)
    zip_path = BACKUPS_DIR / clean_name
    if not zip_path.exists():
        raise Exception(f"Backup file '{clean_name}' not found.")

    zip_path.unlink()
    return {
        "success": True,
        "message": f"Backup '{clean_name}' deleted."
    }

def run_backup_routine(server_mgr):
    """Full workflow: broadcast countdown -> stop -> backup -> restart."""
    global backup_status
    if backup_status["is_busy"]:
        return

    def _task():
        global backup_status
        backup_status["is_busy"] = True
        backup_status["action"] = "backing_up"
        
        was_online = (server_mgr.status in ["online", "starting"])
        
        if was_online:
            try:
                backup_status["message"] = "Broadcasting backup countdown in 1 minute..."
                server_mgr._append_log("[Minenager] Backup countdown started (1 minute warning sent to players).")
                server_mgr.send_command("say §e[Backup] Server will shut down for a backup in 1 minute.")
                time.sleep(30)
                server_mgr.send_command("say §e[Backup] Server backup shutdown in 30 seconds...")
                time.sleep(20)
                server_mgr.send_command("say §c[Backup] Server backup shutdown in 10 seconds! Saving world...")
                time.sleep(10)
                server_mgr.send_command("say §c[Backup] Shutting down now for backup!")
                server_mgr.send_command("save-all")
                time.sleep(2)
            except Exception as e:
                print(f"Error during backup broadcast: {e}")

            backup_status["message"] = "Stopping server..."
            server_mgr.stop(timeout=30)
            
            # Wait until fully offline
            for _ in range(60):
                if server_mgr.status == "offline":
                    break
                time.sleep(1)

        # Create the backup zip
        backup_status["message"] = "Creating world backup zip..."
        created_file = None
        try:
            res = create_world_backup()
            created_file = res.get("filename")
            server_mgr._append_log(f"[Minenager] World backup '{created_file}' created successfully in /data/backups/.")
        except Exception as e:
            server_mgr._append_log(f"[Minenager] Error creating backup: {e}")
            backup_status["last_result"] = {
                "id": time.time(),
                "success": False,
                "action": "backup",
                "message": f"Backup failed: {e}"
            }

        # If it was online, reopen server
        if was_online:
            backup_status["message"] = "Reopening server..."
            time.sleep(2)
            try:
                server_mgr.start()
            except Exception as e:
                print(f"Error restarting server after backup: {e}")

        if created_file:
            backup_status["last_result"] = {
                "id": time.time(),
                "success": True,
                "action": "backup",
                "filename": created_file,
                "message": f"Backup '{created_file}' was made successfully!"
            }

        backup_status["is_busy"] = False
        backup_status["action"] = "idle"
        backup_status["message"] = "Backup completed successfully."

    threading.Thread(target=_task, daemon=True).start()

def run_restore_routine(server_mgr, filename: str):
    """Full workflow: stop if running -> restore zip -> reopen if it was running."""
    global backup_status
    if backup_status["is_busy"]:
        raise Exception("Another backup or restore task is already running.")

    def _task():
        global backup_status
        backup_status["is_busy"] = True
        backup_status["action"] = "restoring"
        
        was_online = (server_mgr.status in ["online", "starting"])

        if was_online:
            try:
                server_mgr._append_log(f"[Minenager] Server is shutting down to restore backup '{filename}'...")
                server_mgr.send_command(f"say §c[Restore] Server is restarting now to restore world backup: {filename}")
                server_mgr.send_command("save-all")
                time.sleep(2)
            except Exception:
                pass

            backup_status["message"] = "Stopping server for restore..."
            server_mgr.stop(timeout=30)
            
            for _ in range(60):
                if server_mgr.status == "offline":
                    break
                time.sleep(1)

        backup_status["message"] = f"Restoring backup {filename}..."
        restore_success = False
        try:
            restore_world_backup(filename)
            restore_success = True
            server_mgr._append_log(f"[Minenager] World backup '{filename}' restored successfully!")
        except Exception as e:
            server_mgr._append_log(f"[Minenager] Error restoring backup: {e}")
            backup_status["last_result"] = {
                "id": time.time(),
                "success": False,
                "action": "restore",
                "filename": filename,
                "message": f"Failed to restore backup '{filename}': {e}"
            }

        if was_online:
            backup_status["message"] = "Reopening server..."
            time.sleep(2)
            try:
                server_mgr.start()
            except Exception as e:
                print(f"Error restarting server after restore: {e}")

        if restore_success:
            backup_status["last_result"] = {
                "id": time.time(),
                "success": True,
                "action": "restore",
                "filename": filename,
                "message": f"World successfully restored to backup '{filename}'!"
            }

        backup_status["is_busy"] = False
        backup_status["action"] = "idle"
        backup_status["message"] = f"Backup '{filename}' restored successfully."

    threading.Thread(target=_task, daemon=True).start()
