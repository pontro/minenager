import os
import json
import shutil
from pathlib import Path
from typing import Dict, Any

MINECRAFT_DIR = Path(os.environ.get("MINECRAFT_DIR", "/data/minecraft" if Path("/data/minecraft").exists() or not Path("./data/minecraft").exists() else "./data/minecraft"))
PROPERTIES_FILE = MINECRAFT_DIR / "server.properties"
SETTINGS_FILE = MINECRAFT_DIR / "dashboard_settings.json"

DEFAULT_PROPERTIES = {
    "gamemode": "survival",
    "difficulty": "easy",
    "max-players": "10",
    "online-mode": "true",
    "pvp": "true",
    "white-list": "false",
    "view-distance": "10",
    "simulation-distance": "10",
    "motd": "A Minecraft Server powered by Minenager",
    "level-name": "world",
    "enable-command-block": "true",
    "spawn-monsters": "true",
    "spawn-animals": "true",
    "allow-flight": "false",
    "server-port": "25565"
}

DEFAULT_DASHBOARD_SETTINGS = {
    "ram_gb": 4,
    "min_ram_gb": 1,
    "java_args": "",
    "autostart": False
}

def parse_properties_file() -> Dict[str, str]:
    """Parse server.properties into a key-value dictionary."""
    MINECRAFT_DIR.mkdir(parents=True, exist_ok=True)
    if not PROPERTIES_FILE.exists():
        save_properties_file(DEFAULT_PROPERTIES)
        return dict(DEFAULT_PROPERTIES)

    properties = {}
    with open(PROPERTIES_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                properties[key.strip()] = val.strip()

    # Enforce default properties if missing
    for k, v in DEFAULT_PROPERTIES.items():
        if k not in properties:
            properties[k] = v

    # Always ensure server-port=25565
    properties["server-port"] = "25565"
    return properties

def save_properties_file(properties: Dict[str, Any]):
    """Write dictionary back to server.properties preserving format and comments where possible."""
    MINECRAFT_DIR.mkdir(parents=True, exist_ok=True)
    existing_lines = []
    keys_written = set()

    if PROPERTIES_FILE.exists():
        with open(PROPERTIES_FILE, "r", encoding="utf-8") as f:
            existing_lines = f.readlines()

    new_lines = []
    for line in existing_lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            key, _ = stripped.split("=", 1)
            key = key.strip()
            if key == "server-port":
                new_lines.append("server-port=25565\n")
                keys_written.add(key)
            elif key in properties:
                val = str(properties[key]).lower() if isinstance(properties[key], bool) else str(properties[key])
                new_lines.append(f"{key}={val}\n")
                keys_written.add(key)
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)

    # Append any new properties that weren't in the file
    for key, val in properties.items():
        if key not in keys_written:
            if key == "server-port":
                new_lines.append("server-port=25565\n")
            else:
                formatted_val = str(val).lower() if isinstance(val, bool) else str(val)
                new_lines.append(f"{key}={formatted_val}\n")

    with open(PROPERTIES_FILE, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

def get_dashboard_settings() -> Dict[str, Any]:
    """Get dashboard-specific settings such as RAM configuration."""
    MINECRAFT_DIR.mkdir(parents=True, exist_ok=True)
    if not SETTINGS_FILE.exists():
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_DASHBOARD_SETTINGS, f, indent=2)
        return dict(DEFAULT_DASHBOARD_SETTINGS)

    try:
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Ensure defaults
            for k, v in DEFAULT_DASHBOARD_SETTINGS.items():
                if k not in data:
                    data[k] = v
            return data
    except Exception:
        return dict(DEFAULT_DASHBOARD_SETTINGS)

def save_dashboard_settings(settings: Dict[str, Any]):
    """Save RAM and dashboard-specific settings."""
    MINECRAFT_DIR.mkdir(parents=True, exist_ok=True)
    current = get_dashboard_settings()
    current.update(settings)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=2)

def get_all_settings() -> Dict[str, Any]:
    """Retrieve full combined settings."""
    props = parse_properties_file()
    dash = get_dashboard_settings()
    return {
        "properties": props,
        "ram_gb": dash.get("ram_gb", 4),
        "min_ram_gb": dash.get("min_ram_gb", 1),
        "java_args": dash.get("java_args", ""),
        "autostart": bool(dash.get("autostart", False))
    }

def update_all_settings(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Update properties and RAM settings."""
    dash_update = {}
    if "ram_gb" in payload:
        dash_update["ram_gb"] = int(payload["ram_gb"])
    if "min_ram_gb" in payload:
        dash_update["min_ram_gb"] = int(payload["min_ram_gb"])
    if "java_args" in payload:
        dash_update["java_args"] = str(payload["java_args"])
    if "autostart" in payload:
        dash_update["autostart"] = bool(payload["autostart"])
    
    if dash_update:
        save_dashboard_settings(dash_update)

    if "properties" in payload and isinstance(payload["properties"], dict):
        save_properties_file(payload["properties"])

    return get_all_settings()

def delete_world_data() -> Dict[str, Any]:
    """Delete world saves and dimension files while preserving server.jar, mods, configs, and instance metadata."""
    props = parse_properties_file()
    level_name = props.get("level-name", "world").strip() or "world"

    deleted_paths = []
    candidates = [
        level_name,
        f"{level_name}_nether",
        f"{level_name}_the_end",
        "DIM-1",
        "DIM1"
    ]

    for name in candidates:
        target = MINECRAFT_DIR / name
        if target.exists() and target.is_dir():
            try:
                shutil.rmtree(target)
                deleted_paths.append(name)
            except Exception as e:
                print(f"Error removing world directory {name}: {e}")

    return {
        "success": True,
        "message": f"World '{level_name}' deleted. A fresh world will be generated next time the server starts.",
        "deleted_folders": deleted_paths
    }

def reset_server_data() -> Dict[str, Any]:
    """Completely wipe /data/minecraft/ and reinitialize clean defaults."""
    if MINECRAFT_DIR.exists():
        for item in MINECRAFT_DIR.iterdir():
            try:
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()
            except Exception as e:
                print(f"Error removing {item}: {e}")

    # Recreate structure
    MINECRAFT_DIR.mkdir(parents=True, exist_ok=True)
    (MINECRAFT_DIR / "mods").mkdir(parents=True, exist_ok=True)
    save_properties_file(DEFAULT_PROPERTIES)
    save_dashboard_settings(DEFAULT_DASHBOARD_SETTINGS)

    # Recreate default eula.txt
    with open(MINECRAFT_DIR / "eula.txt", "w") as f:
        f.write("# Generated by Dashboard\neula=true\n")

    return {
        "success": True,
        "message": "All Minecraft server files have been deleted and reset to 0."
    }
