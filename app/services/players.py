import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

MINECRAFT_DIR = Path("/data/minecraft")

def _read_json_file(file_name: str) -> List[Dict[str, Any]]:
    path = MINECRAFT_DIR / file_name
    if not path.exists():
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
    except Exception as e:
        print(f"Error reading {file_name}: {e}")
    return []

def get_ops() -> List[Dict[str, Any]]:
    """Return list of server operators from ops.json."""
    return _read_json_file("ops.json")

def get_whitelist() -> List[Dict[str, Any]]:
    """Return list of whitelisted players from whitelist.json."""
    return _read_json_file("whitelist.json")

def get_banned_players() -> List[Dict[str, Any]]:
    """Return list of banned players from banned-players.json."""
    return _read_json_file("banned-players.json")

def get_online_players_from_logs(logs: List[Dict[str, Any]]) -> List[str]:
    """Parse recent join/leave events from server logs to determine online players."""
    online = set()
    # Patterns for player join / leave in vanilla & fabric
    # [Server thread/INFO]: PlayerName joined the game
    # [Server thread/INFO]: PlayerName left the game
    # [Server thread/INFO]: PlayerName lost connection: ...
    join_pattern = re.compile(r":\s*([a-zA-Z0-9_]{2,16})\s+joined the game", re.IGNORECASE)
    leave_pattern = re.compile(r":\s*([a-zA-Z0-9_]{2,16})\s+(left the game|lost connection)", re.IGNORECASE)

    for log in logs:
        text = log.get("text", "")
        m_join = join_pattern.search(text)
        if m_join:
            player = m_join.group(1)
            online.add(player)
            continue
        m_leave = leave_pattern.search(text)
        if m_leave:
            player = m_leave.group(1)
            online.discard(player)

    return list(online)

def get_all_players_data(server_mgr) -> Dict[str, Any]:
    """Return comprehensive players status (online, ops, whitelist, bans)."""
    ops = get_ops()
    whitelist = get_whitelist()
    bans = get_banned_players()

    op_names = {o.get("name", "").lower() for o in ops if "name" in o}
    whitelist_names = {w.get("name", "").lower() for w in whitelist if "name" in w}

    # If server is offline, online players is empty
    online_names = []
    if server_mgr.status == "online":
        logs = server_mgr.get_logs(0)["logs"]
        online_names = get_online_players_from_logs(logs)

    online_list = []
    for name in online_names:
        online_list.append({
            "name": name,
            "is_op": name.lower() in op_names,
            "is_whitelisted": name.lower() in whitelist_names,
            "avatar_url": f"https://minotar.net/helm/{name}/32.png"
        })

    return {
        "online": online_list,
        "online_count": len(online_list),
        "ops": ops,
        "whitelist": whitelist,
        "banned": bans
    }

def execute_player_action(server_mgr, action: str, player: str, reason: Optional[str] = None) -> Dict[str, Any]:
    """Execute moderation and permissions commands via server console stdin."""
    player_clean = re.sub(r'[^a-zA-Z0-9_]', '', player.strip())
    if not player_clean:
        raise Exception("Invalid player name.")

    cmd = None
    if action == "op":
        cmd = f"op {player_clean}"
    elif action == "deop":
        cmd = f"deop {player_clean}"
    elif action == "kick":
        reason_str = f" {reason.strip()}" if reason else ""
        cmd = f"kick {player_clean}{reason_str}"
    elif action == "ban":
        reason_str = f" {reason.strip()}" if reason else ""
        cmd = f"ban {player_clean}{reason_str}"
    elif action == "pardon":
        cmd = f"pardon {player_clean}"
    elif action == "whitelist_add":
        cmd = f"whitelist add {player_clean}"
    elif action == "whitelist_remove":
        cmd = f"whitelist remove {player_clean}"
    else:
        raise Exception(f"Unknown player action '{action}'.")

    if server_mgr.status != "online":
        # If server is offline, we can still modify json files directly if desired, but notifying user
        raise Exception("Server must be online to execute player actions.")

    server_mgr.send_command(cmd)
    return {
        "success": True,
        "action": action,
        "player": player_clean,
        "command": cmd,
        "message": f"Command '/{cmd}' executed successfully."
    }
