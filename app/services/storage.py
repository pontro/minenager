import os
import shutil
from pathlib import Path
from typing import Dict, Any

MINECRAFT_DIR = Path("/data/minecraft")
BACKUPS_DIR = Path("/data/backups")

def get_dir_size(path: Path) -> int:
    """Calculate recursive size of a directory in bytes."""
    if not path.exists():
        return 0
    total = 0
    try:
        if path.is_file():
            return path.stat().st_size
        for root, _, files in os.walk(path):
            for f in files:
                fp = Path(root) / f
                try:
                    total += fp.stat().st_size
                except Exception:
                    pass
    except Exception:
        pass
    return total

def format_size(bytes_val: int) -> str:
    """Format bytes into human-readable string."""
    if bytes_val >= 1024 * 1024 * 1024:
        return f"{round(bytes_val / (1024 * 1024 * 1024), 2)} GB"
    if bytes_val >= 1024 * 1024:
        return f"{round(bytes_val / (1024 * 1024), 1)} MB"
    if bytes_val >= 1024:
        return f"{round(bytes_val / 1024, 1)} KB"
    return f"{bytes_val} B"

def get_storage_breakdown() -> Dict[str, Any]:
    """Calculate disk utilization across worlds, backups, mods, and logs."""
    world_dirs = ["world", "world_nether", "world_the_end", "DIM1", "DIM-1"]
    world_bytes = sum(get_dir_size(MINECRAFT_DIR / d) for d in world_dirs)
    
    backups_bytes = get_dir_size(BACKUPS_DIR)
    mods_bytes = get_dir_size(MINECRAFT_DIR / "mods")
    
    logs_dir = MINECRAFT_DIR / "logs"
    crash_dir = MINECRAFT_DIR / "crash-reports"
    logs_bytes = get_dir_size(logs_dir) + get_dir_size(crash_dir)

    # Include root .hprof and .dmp heap dump files in the logs & dumps calculation
    if MINECRAFT_DIR.exists():
        for pattern in ("*.hprof", "*.dmp"):
            for f in MINECRAFT_DIR.glob(pattern):
                try:
                    logs_bytes += f.stat().st_size
                except Exception:
                    pass

    total_server_bytes = get_dir_size(MINECRAFT_DIR) + backups_bytes

    # Get total and free space of partition
    total_disk, used_disk, free_disk = 0, 0, 0
    try:
        stat = shutil.disk_usage(str(MINECRAFT_DIR if MINECRAFT_DIR.exists() else "/"))
        total_disk = stat.total
        free_disk = stat.free
        used_disk = stat.used
    except Exception as e:
        print(f"Error checking disk usage: {e}")

    return {
        "world_bytes": world_bytes,
        "world_formatted": format_size(world_bytes),
        "backups_bytes": backups_bytes,
        "backups_formatted": format_size(backups_bytes),
        "mods_bytes": mods_bytes,
        "mods_formatted": format_size(mods_bytes),
        "logs_bytes": logs_bytes,
        "logs_formatted": format_size(logs_bytes),
        "total_server_bytes": total_server_bytes,
        "total_server_formatted": format_size(total_server_bytes),
        "free_disk_bytes": free_disk,
        "free_disk_formatted": format_size(free_disk),
        "total_disk_bytes": total_disk,
        "total_disk_formatted": format_size(total_disk)
    }

def clean_old_logs() -> Dict[str, Any]:
    """Delete archived .log.gz files, Java heap dumps (.hprof / .dmp), and old crash dumps to reclaim disk space."""
    logs_dir = MINECRAFT_DIR / "logs"
    crash_dir = MINECRAFT_DIR / "crash-reports"

    reclaimed_bytes = 0
    deleted_files = 0

    # Delete archived .log.gz files (preserving latest.log)
    if logs_dir.exists():
        for f in logs_dir.glob("*.log.gz"):
            try:
                reclaimed_bytes += f.stat().st_size
                f.unlink()
                deleted_files += 1
            except Exception as e:
                print(f"Error deleting log {f}: {e}")

    # Delete old crash reports
    if crash_dir.exists():
        for f in crash_dir.glob("*.txt"):
            try:
                reclaimed_bytes += f.stat().st_size
                f.unlink()
                deleted_files += 1
            except Exception as e:
                print(f"Error deleting crash dump {f}: {e}")

    # Delete JVM heap dumps (.hprof and .dmp files) across Minecraft directory, logs, and crash reports
    target_dirs = [MINECRAFT_DIR, logs_dir, crash_dir]
    for d in target_dirs:
        if d.exists():
            for pattern in ("*.hprof", "*.dmp"):
                for f in d.glob(pattern):
                    try:
                        reclaimed_bytes += f.stat().st_size
                        f.unlink()
                        deleted_files += 1
                    except Exception as e:
                        print(f"Error deleting heap dump {f}: {e}")

    return {
        "success": True,
        "deleted_files_count": deleted_files,
        "reclaimed_bytes": reclaimed_bytes,
        "reclaimed_formatted": format_size(reclaimed_bytes),
        "message": f"Cleaned {deleted_files} old log archives & heap dumps, freeing {format_size(reclaimed_bytes)}."
    }
