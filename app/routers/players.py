from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services import players as players_service
from app.services.server_process import server_manager

router = APIRouter(prefix="/api/players", tags=["players"])

class PlayerActionRequest(BaseModel):
    action: str  # "op", "deop", "kick", "ban", "pardon", "whitelist_add", "whitelist_remove"
    player: str
    reason: Optional[str] = None

@router.get("")
async def get_players():
    """Get online players, ops, whitelist, and banned players."""
    try:
        data = players_service.get_all_players_data(server_manager)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/action")
async def player_action(req: PlayerActionRequest):
    """Execute a moderation/permission command on a player."""
    try:
        res = players_service.execute_player_action(
            server_manager,
            action=req.action,
            player=req.player,
            reason=req.reason
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
