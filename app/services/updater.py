import os
import subprocess
import threading
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

def _get_repo_dir() -> Path:
    """Find the root Git repository directory."""
    candidates = [
        Path("/repo"),
        Path("/code"),
        Path(__file__).resolve().parent.parent.parent
    ]
    for c in candidates:
        if (c / ".git").exists():
            return c
    # Fallback to parent of app
    return Path(__file__).resolve().parent.parent.parent

def _run_git_command(args: List[str], cwd: Optional[Path] = None) -> tuple[int, str]:
    """Execute a git command with safe directory configuration."""
    target_cwd = str(cwd or _get_repo_dir())
    try:
        # Ensure git safe.directory is set for container environments
        subprocess.run(
            ["git", "config", "--global", "--add", "safe.directory", "*"],
            capture_output=True,
            timeout=5
        )
        res = subprocess.run(
            ["git"] + args,
            cwd=target_cwd,
            capture_output=True,
            text=True,
            timeout=25
        )
        output = (res.stdout or "") + (res.stderr or "")
        return res.returncode, output.strip()
    except Exception as e:
        return 1, str(e)

def get_current_version() -> Dict[str, Any]:
    """Get current commit hash, commit message, and date."""
    repo_dir = _get_repo_dir()
    if not (repo_dir / ".git").exists():
        return {
            "commit": "unknown",
            "message": "Git repository not found",
            "date": "unknown",
            "branch": "main"
        }

    code, out = _run_git_command(["log", "-1", "--format=%h|%s|%cr|%an"], cwd=repo_dir)
    if code == 0 and "|" in out:
        parts = out.split("|")
        return {
            "commit": parts[0],
            "message": parts[1] if len(parts) > 1 else "",
            "date": parts[2] if len(parts) > 2 else "",
            "author": parts[3] if len(parts) > 3 else "",
            "branch": get_current_branch()
        }
    return {
        "commit": "unknown",
        "message": out or "Error reading git log",
        "date": "unknown",
        "branch": "main"
    }

def get_current_branch() -> str:
    """Get current active git branch."""
    code, out = _run_git_command(["rev-parse", "--abbrev-ref", "HEAD"])
    return out if code == 0 else "main"

def check_for_updates() -> Dict[str, Any]:
    """Fetch remote repository and check if new commits are available."""
    repo_dir = _get_repo_dir()
    current = get_current_version()

    # 1. Fetch remote origin
    code, fetch_out = _run_git_command(["fetch", "origin", "main"], cwd=repo_dir)
    if code != 0:
        return {
            "success": False,
            "has_update": False,
            "current": current,
            "error": f"Failed to reach remote repository: {fetch_out}"
        }

    # 2. Check commit difference
    code_local, local_hash = _run_git_command(["rev-parse", "HEAD"], cwd=repo_dir)
    code_remote, remote_hash = _run_git_command(["rev-parse", "origin/main"], cwd=repo_dir)

    has_update = (code_local == 0 and code_remote == 0 and local_hash != remote_hash)

    commits_behind = []
    if has_update:
        code_log, log_out = _run_git_command(["log", "HEAD..origin/main", "--oneline", "-n", "10"], cwd=repo_dir)
        if code_log == 0 and log_out:
            commits_behind = log_out.splitlines()

    return {
        "success": True,
        "has_update": has_update,
        "current": current,
        "remote_commit": remote_hash[:7] if code_remote == 0 else "unknown",
        "commits_behind": commits_behind,
        "commits_count": len(commits_behind)
    }

def perform_update() -> Dict[str, Any]:
    """Pull latest changes from origin/main and trigger restart."""
    repo_dir = _get_repo_dir()

    # 1. Execute git pull
    code, out = _run_git_command(["pull", "origin", "main"], cwd=repo_dir)
    if code != 0:
        raise Exception(f"Git pull failed: {out}")

    updated_ver = get_current_version()

    # 2. Schedule graceful reload / container restart in background thread
    def _delayed_restart():
        time.sleep(2.0)
        # Touch app/main.py to trigger Uvicorn hot-reload, or exit so Docker restarts
        try:
            main_file = Path(__file__).resolve().parent.parent / "main.py"
            if main_file.exists():
                main_file.touch()
        except Exception:
            pass
        # Exit process cleanly; docker restart: unless-stopped will resurrect container
        time.sleep(1.0)
        os._exit(0)

    threading.Thread(target=_delayed_restart, daemon=True).start()

    return {
        "success": True,
        "message": "Successfully updated Minenager to the latest version!",
        "output": out,
        "version": updated_ver
    }
