from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services import settings as settings_service
from app.services.server_process import server_manager

router = APIRouter(prefix="/api/settings", tags=["settings"])

class UpdateSettingsRequest(BaseModel):
    ram_gb: Optional[int] = None
    min_ram_gb: Optional[int] = None
    java_args: Optional[str] = None
    autostart: Optional[bool] = None
    properties: Optional[Dict[str, Any]] = None

@router.get("")
async def get_settings():
    try:
        return settings_service.get_all_settings()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def update_settings(payload: UpdateSettingsRequest):
    try:
        data = payload.dict(exclude_unset=True)
        updated = settings_service.update_all_settings(data)
        return {"success": True, "settings": updated}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/delete-world")
async def delete_world():
    if server_manager.status != "offline":
        raise HTTPException(status_code=400, detail="Cannot delete world while the server is running. Please stop the server first.")
    try:
        return settings_service.delete_world_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset")
async def reset_server():
    if server_manager.status != "offline":
        raise HTTPException(status_code=400, detail="Cannot reset server while it is running. Please stop the server first.")
    try:
        return settings_service.reset_server_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
