from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.discord_bot import discord_bot_manager, get_config, save_config

router = APIRouter(prefix="/api/discord", tags=["discord"])

class SaveDiscordConfigRequest(BaseModel):
    enabled: bool
    token: Optional[str] = ""
    channel_id: Optional[str] = ""
    admin_ids: Optional[List[str]] = []
    admin_role_ids: Optional[List[str]] = []
    allow_public_status: Optional[bool] = True
    prefix: Optional[str] = "!"
    notify_server_start: Optional[bool] = True
    notify_server_stop: Optional[bool] = True
    notify_player_join_leave: Optional[bool] = True
    notify_server_crash: Optional[bool] = True

@router.get("")
async def get_discord_info():
    try:
        cfg = get_config()
        # Mask token for security in GET
        masked_cfg = dict(cfg)
        token = cfg.get("token", "")
        if token and len(token) > 10:
            masked_cfg["token_masked"] = f"{token[:4]}••••••••{token[-4:]}"
        else:
            masked_cfg["token_masked"] = ""

        status_info = discord_bot_manager.get_status_info()
        return {
            "config": masked_cfg,
            "status": status_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def update_discord_config(payload: SaveDiscordConfigRequest):
    try:
        data = payload.dict()
        # If token was not changed (e.g. user submitted existing or empty when already saved)
        existing = get_config()
        if not data.get("token") and existing.get("token"):
            data["token"] = existing.get("token")

        updated = save_config(data)

        # Restart bot with new configuration
        if updated.get("enabled"):
            await discord_bot_manager.restart()
        else:
            await discord_bot_manager.stop()

        status_info = discord_bot_manager.get_status_info()
        return {
            "success": True,
            "config": updated,
            "status": status_info
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/test")
async def test_discord_notification():
    try:
        res = await discord_bot_manager.send_test_message()
        if not res.get("success"):
            raise HTTPException(status_code=400, detail=res.get("message", "Test failed"))
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
