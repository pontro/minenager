import asyncio
import json
import logging
import urllib.request
import urllib.error
import ssl
from pathlib import Path
from typing import Dict, Any, Optional, List
import websockets
from app.services.server_process import server_manager
from app.services import settings as settings_service, mrpack as mrpack_service, players as players_service

logger = logging.getLogger("minenager.discord")

MINECRAFT_DIR = Path("/data/minecraft")
CONFIG_FILE = MINECRAFT_DIR / "discord_config.json"

DEFAULT_CONFIG: Dict[str, Any] = {
    "enabled": False,
    "token": "",
    "channel_id": "",
    "admin_ids": [],
    "admin_role_ids": [],
    "allow_public_status": True,
    "prefix": "!",
    "notify_server_start": True,
    "notify_server_stop": True,
    "notify_player_join_leave": True,
    "notify_server_crash": True
}

def get_config() -> Dict[str, Any]:
    MINECRAFT_DIR.mkdir(parents=True, exist_ok=True)
    if not CONFIG_FILE.exists():
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_CONFIG, f, indent=2)
        return dict(DEFAULT_CONFIG)
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            for k, v in DEFAULT_CONFIG.items():
                if k not in data:
                    data[k] = v
            return data
    except Exception as e:
        logger.error(f"Error reading discord_config.json: {e}")
        return dict(DEFAULT_CONFIG)

def save_config(new_config: Dict[str, Any]) -> Dict[str, Any]:
    MINECRAFT_DIR.mkdir(parents=True, exist_ok=True)
    current = get_config()
    current.update(new_config)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=2)
    return current

def _send_rest_sync(token: str, channel_id: str, payload: Dict[str, Any]) -> tuple:
    url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
    body = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bot {token}",
            "Content-Type": "application/json",
            "User-Agent": "MinenagerBot (https://github.com/pontro/minenager, 1.0)"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return True, "OK"
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8', errors='ignore')
        return False, f"HTTP {e.code}: {err_msg[:120]}"
    except Exception as e:
        return False, str(e)

class DiscordBotManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DiscordBotManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.status = "disconnected"  # disconnected, connecting, connected, error, disabled
        self.bot_user: Optional[Dict[str, Any]] = None
        self.last_error: Optional[str] = None
        self._task: Optional[asyncio.Task] = None
        self._ws = None
        self._heartbeat_task: Optional[asyncio.Task] = None
        self._last_sequence: Optional[int] = None
        self._stop_requested = False

    def get_status_info(self) -> Dict[str, Any]:
        cfg = get_config()
        return {
            "enabled": cfg.get("enabled", False),
            "status": "disabled" if not cfg.get("enabled", False) else self.status,
            "bot_user": self.bot_user,
            "last_error": self.last_error,
            "channel_id": cfg.get("channel_id", ""),
            "prefix": cfg.get("prefix", "!")
        }

    async def start(self):
        cfg = get_config()
        if not cfg.get("enabled") or not cfg.get("token"):
            self.status = "disabled"
            return

        if self._task and not self._task.done():
            return

        self._stop_requested = False
        self.status = "connecting"
        self.last_error = None
        self._task = asyncio.create_task(self._run_bot_loop())

    async def stop(self):
        self._stop_requested = True
        self.status = "disconnected"
        if self._heartbeat_task and not self._heartbeat_task.done():
            self._heartbeat_task.cancel()
        if self._ws:
            try:
                await self._ws.close()
            except Exception:
                pass
        if self._task and not self._task.done():
            self._task.cancel()

    async def restart(self):
        await self.stop()
        await asyncio.sleep(0.5)
        await self.start()

    async def send_rest_message(self, channel_id: str, content: Optional[str] = None, embed: Optional[Dict[str, Any]] = None) -> bool:
        cfg = get_config()
        token = cfg.get("token", "").strip()
        if not token or not channel_id:
            return False

        payload: Dict[str, Any] = {}
        if content:
            payload["content"] = content
        if embed:
            payload["embeds"] = [embed]

        ok, err = await asyncio.to_thread(_send_rest_sync, token, channel_id, payload)
        if not ok:
            logger.error(f"Failed to send Discord message: {err}")
            self.last_error = err
        return ok

    async def send_test_message(self) -> Dict[str, Any]:
        cfg = get_config()
        channel_id = cfg.get("channel_id", "").strip()
        if not channel_id:
            return {"success": False, "message": "Channel ID is not set."}
        if not cfg.get("token", "").strip():
            return {"success": False, "message": "Bot Token is not set."}

        test_embed = {
            "title": "⛏️ Minenager Discord Integration Active!",
            "description": "Successfully connected to your Minecraft Server Dashboard.\nYou can now use commands like `!status`, `!turnon`, `!turnoff`, and receive live game events here.",
            "color": 2276180,  # Sage / Emerald Green
            "fields": [
                {"name": "Command Prefix", "value": f"`{cfg.get('prefix', '!')}`", "inline": True},
                {"name": "Public Status Check", "value": "Enabled" if cfg.get("allow_public_status") else "Admin Only", "inline": True},
                {"name": "Configured Admins", "value": f"{len(cfg.get('admin_ids', []))} Users / {len(cfg.get('admin_role_ids', []))} Roles", "inline": True}
            ],
            "footer": {
                "text": "Minenager • Minecraft Server Manager"
            }
        }
        ok = await self.send_rest_message(channel_id, embed=test_embed)
        if ok:
            return {"success": True, "message": "Test notification delivered to Discord!"}
        else:
            return {"success": False, "message": f"Failed to send: {self.last_error or 'Check Bot Token & Channel permissions'}"}

    async def broadcast_event(self, event_type: str, **kwargs):
        cfg = get_config()
        if not cfg.get("enabled"):
            return
        channel_id = cfg.get("channel_id", "").strip()
        if not channel_id:
            return

        embed = None
        instance = mrpack_service.get_current_instance()
        mc_ver = instance.get("minecraft_version", "1.20.1") if instance else "1.20.1"
        loader = instance.get("loader", "Fabric").capitalize() if instance else "Fabric"

        if event_type == "server_start" and cfg.get("notify_server_start", True):
            embed = {
                "title": "🟢 Minecraft Server is Online!",
                "description": f"The server is ready for connections on port **25565**.",
                "color": 3066993,
                "fields": [
                    {"name": "Version", "value": f"Minecraft {mc_ver} ({loader})", "inline": True},
                    {"name": "RAM Allocated", "value": kwargs.get("ram", "4 GB"), "inline": True}
                ],
                "footer": {"text": "Minenager • Server Online"}
            }
        elif event_type == "server_stop" and cfg.get("notify_server_stop", True):
            embed = {
                "title": "🔴 Minecraft Server Stopped",
                "description": "The Minecraft server process has shut down.",
                "color": 15158332,
                "footer": {"text": "Minenager • Server Offline"}
            }
        elif event_type == "player_join" and cfg.get("notify_player_join_leave", True):
            player = kwargs.get("player", "Player")
            count = kwargs.get("count", 1)
            embed = {
                "title": f"👤 {player} joined the game",
                "description": f"**{player}** connected to the world.",
                "color": 3447003,
                "thumbnail": {"url": f"https://minotar.net/avatar/{player}/64.png"},
                "footer": {"text": f"Minenager • {count} player(s) online"}
            }
        elif event_type == "player_leave" and cfg.get("notify_player_join_leave", True):
            player = kwargs.get("player", "Player")
            count = kwargs.get("count", 0)
            embed = {
                "title": f"🚪 {player} left the game",
                "description": f"**{player}** disconnected.",
                "color": 10070709,
                "thumbnail": {"url": f"https://minotar.net/avatar/{player}/64.png"},
                "footer": {"text": f"Minenager • {count} player(s) online"}
            }
        elif event_type == "server_crash" and cfg.get("notify_server_crash", True):
            reason = kwargs.get("reason", "Unexpected termination")
            embed = {
                "title": "⚠️ Minecraft Server Crashed",
                "description": f"The server stopped unexpectedly.\n```\n{reason[:300]}\n```",
                "color": 16744272,
                "footer": {"text": "Minenager • Crash Alert"}
            }

        if embed:
            await self.send_rest_message(channel_id, embed=embed)

    async def _heartbeat_loop(self, ws, interval_ms: int):
        while not self._stop_requested:
            try:
                await asyncio.sleep(interval_ms / 1000.0)
                if ws:
                    payload = json.dumps({"op": 1, "d": self._last_sequence})
                    await ws.send(payload)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
                break

    async def _run_bot_loop(self):
        ssl_ctx = ssl.create_default_context()
        while not self._stop_requested:
            cfg = get_config()
            token = cfg.get("token", "").strip()
            if not cfg.get("enabled") or not token:
                self.status = "disabled"
                break

            try:
                gateway_url = "wss://gateway.discord.gg/?v=10&encoding=json"
                self.status = "connecting"

                async with websockets.connect(gateway_url, ssl=ssl_ctx) as ws:
                    self._ws = ws

                    async for message in ws:
                        if self._stop_requested:
                            break

                        data = json.loads(message)
                        op = data.get("op")
                        seq = data.get("s")
                        if seq is not None:
                            self._last_sequence = seq
                        t = data.get("t")
                        d = data.get("d")

                        # Opcode 10: Hello -> start heartbeat & identify
                        if op == 10:
                            heartbeat_interval = d["heartbeat_interval"]
                            if self._heartbeat_task and not self._heartbeat_task.done():
                                self._heartbeat_task.cancel()
                            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop(ws, heartbeat_interval))

                            # Send Opcode 2: Identify
                            identify_payload = {
                                "op": 2,
                                "d": {
                                    "token": token,
                                    "intents": 37377,
                                    "properties": {
                                        "os": "linux",
                                        "browser": "Minenager",
                                        "device": "Minenager"
                                    },
                                    "presence": {
                                        "activities": [{
                                            "name": "Minecraft Server",
                                            "type": 0
                                        }],
                                        "status": "online",
                                        "afk": False
                                    }
                                }
                            }
                            await ws.send(json.dumps(identify_payload))

                        # Opcode 0: Dispatch Events
                        elif op == 0:
                            if t == "READY":
                                self.status = "connected"
                                self.bot_user = d.get("user")
                                self.last_error = None
                                logger.info(f"Discord Bot connected as {self.bot_user.get('username')}")

                            elif t == "MESSAGE_CREATE":
                                asyncio.create_task(self._handle_message(d))

                        elif op in (7, 9):
                            logger.info("Discord requested reconnect.")
                            break

            except Exception as e:
                logger.error(f"Discord connection error: {e}")
                self.status = "error"
                self.last_error = str(e)
            finally:
                if self._heartbeat_task and not self._heartbeat_task.done():
                    self._heartbeat_task.cancel()

            if not self._stop_requested:
                await asyncio.sleep(5)

    def _is_admin(self, author: Dict[str, Any], member: Optional[Dict[str, Any]], cfg: Dict[str, Any]) -> bool:
        user_id = str(author.get("id", ""))
        admin_ids = [str(x).strip() for x in cfg.get("admin_ids", []) if str(x).strip()]
        admin_role_ids = [str(x).strip() for x in cfg.get("admin_role_ids", []) if str(x).strip()]

        if not admin_ids and not admin_role_ids:
            return True

        if user_id in admin_ids:
            return True

        if member:
            user_roles = [str(r) for r in member.get("roles", [])]
            for r in user_roles:
                if r in admin_role_ids:
                    return True
            perms = int(member.get("permissions", "0"))
            if perms & 0x8:
                return True

        return False

    async def _handle_message(self, data: Dict[str, Any]):
        author = data.get("author", {})
        if author.get("bot", False):
            return

        cfg = get_config()
        prefix = cfg.get("prefix", "!")
        content = data.get("content", "").strip()
        channel_id = str(data.get("channel_id", ""))
        configured_channel = str(cfg.get("channel_id", "")).strip()

        if configured_channel and channel_id != configured_channel:
            return

        if not content.startswith(prefix):
            return

        raw_cmd = content[len(prefix):].strip()
        parts = raw_cmd.split()
        if not parts:
            return

        cmd = parts[0].lower()
        args = parts[1:]
        is_admin = self._is_admin(author, data.get("member"), cfg)
        allow_public_status = cfg.get("allow_public_status", True)

        # 1. Status Command
        if cmd in ["status", "info"]:
            if not is_admin and not allow_public_status:
                await self.send_rest_message(channel_id, "⛔ You do not have permission to view server status.")
                return

            status_info = server_manager.get_status()
            instance = mrpack_service.get_current_instance()
            mc_ver = instance.get("minecraft_version", "1.20.1") if instance else "1.20.1"
            loader = instance.get("loader", "Fabric").capitalize() if instance else "Fabric"
            online_list = players_service.get_online_players()
            max_players = settings_service.get_all_settings()["properties"].get("max-players", "10")

            is_online = status_info["status"] == "online"
            color = 3066993 if is_online else (16744272 if status_info["status"] == "starting" else 15158332)

            embed = {
                "title": "⛏️ Minecraft Server Status",
                "color": color,
                "fields": [
                    {"name": "State", "value": f"`{status_info['status'].upper()}`", "inline": True},
                    {"name": "Software", "value": f"Minecraft {mc_ver} ({loader})", "inline": True},
                    {"name": "RAM Allocated", "value": status_info.get("ram_allocated", "4 GB"), "inline": True},
                    {"name": "Players Online", "value": f"`{len(online_list)} / {max_players}`", "inline": True},
                    {"name": "Uptime", "value": f"{status_info.get('uptime_seconds', 0) // 60} minutes", "inline": True}
                ],
                "footer": {"text": "Minenager Dashboard"}
            }
            await self.send_rest_message(channel_id, embed=embed)

        # 2. Players Command
        elif cmd in ["players", "list", "who"]:
            if not is_admin and not allow_public_status:
                await self.send_rest_message(channel_id, "⛔ You do not have permission to view player list.")
                return

            online_list = players_service.get_online_players()
            if not online_list:
                await self.send_rest_message(channel_id, "👥 **0 players** are currently connected.")
            else:
                names = [f"• **{p}**" for p in online_list]
                embed = {
                    "title": f"👥 Online Players ({len(online_list)})",
                    "description": "\n".join(names),
                    "color": 3447003,
                    "thumbnail": {"url": f"https://minotar.net/avatar/{online_list[0]}/64.png"}
                }
                await self.send_rest_message(channel_id, embed=embed)

        # 3. Turn On / Start Command
        elif cmd in ["turnon", "start", "on"]:
            if not is_admin:
                await self.send_rest_message(channel_id, "⛔ Permission denied: Only Admins can start the server.")
                return

            curr = server_manager.get_status()["status"]
            if curr in ["online", "starting"]:
                await self.send_rest_message(channel_id, f"⚠️ Server is already `{curr}`.")
                return

            await self.send_rest_message(channel_id, "⏳ Launching Minecraft server...")
            all_settings = settings_service.get_all_settings()
            server_manager.start_server(
                ram_gb=all_settings.get("ram_gb", 4),
                min_ram_gb=all_settings.get("min_ram_gb", 1),
                java_args=all_settings.get("java_args", "")
            )

        # 4. Turn Off / Stop Command
        elif cmd in ["turnoff", "stop", "off"]:
            if not is_admin:
                await self.send_rest_message(channel_id, "⛔ Permission denied: Only Admins can stop the server.")
                return

            curr = server_manager.get_status()["status"]
            if curr == "offline":
                await self.send_rest_message(channel_id, "⚠️ Server is already offline.")
                return

            await self.send_rest_message(channel_id, "⏳ Saving world and cleanly stopping the server...")
            server_manager.stop_server()

        # 5. Restart Command
        elif cmd in ["restart", "reboot"]:
            if not is_admin:
                await self.send_rest_message(channel_id, "⛔ Permission denied: Only Admins can restart the server.")
                return

            await self.send_rest_message(channel_id, "🔄 Restarting Minecraft server...")
            server_manager.restart_server()

        # 6. Execute Console Command
        elif cmd in ["cmd", "command", "exec"]:
            if not is_admin:
                await self.send_rest_message(channel_id, "⛔ Permission denied: Only Admins can execute console commands.")
                return

            if not args:
                await self.send_rest_message(channel_id, f"Usage: `{prefix}cmd <command>` (e.g. `{prefix}cmd time set day` or `{prefix}cmd whitelist add Steve`)")
                return

            mc_cmd = " ".join(args)
            server_manager.send_command(mc_cmd)
            await self.send_rest_message(channel_id, f"💻 Sent command to Minecraft console: `{mc_cmd}`")

        # 7. Help Command
        elif cmd in ["help", "commands"]:
            fields = [
                {"name": f"`{prefix}status`", "value": "Check live server status and RAM", "inline": True},
                {"name": f"`{prefix}players`", "value": "List all players currently online", "inline": True}
            ]
            if is_admin:
                fields.extend([
                    {"name": f"`{prefix}turnon`", "value": "Start the Minecraft server", "inline": True},
                    {"name": f"`{prefix}turnoff`", "value": "Cleanly stop the Minecraft server", "inline": True},
                    {"name": f"`{prefix}restart`", "value": "Restart the server", "inline": True},
                    {"name": f"`{prefix}cmd <command>`", "value": "Run a Minecraft console command", "inline": True}
                ])

            embed = {
                "title": "⛏️ Minenager Bot Commands",
                "description": f"Prefix is `{prefix}`. You have **{'Admin' if is_admin else 'Player'}** access.",
                "color": 2276180,
                "fields": fields,
                "footer": {"text": "Minenager • Minecraft Server Manager"}
            }
            await self.send_rest_message(channel_id, embed=embed)

discord_bot_manager = DiscordBotManager()
