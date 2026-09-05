from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.services import backup as backup_service
from app.services.server_process import server_manager

router = APIRouter(prefix="/api/backups", tags=["backups"])

class BackupActionRequest(BaseModel):
    filename: str

@router.get("")
async def get_backups():
    try:
        backups = backup_service.list_backups()
        return {
            "backups": backups,
            "count": len(backups),
            "max": backup_service.MAX_BACKUPS,
            "status": backup_service.backup_status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create")
async def create_backup():
    if backup_service.backup_status["is_busy"]:
        raise HTTPException(status_code=400, detail="A backup or restore operation is already in progress.")
    try:
        backup_service.run_backup_routine(server_manager)
        return {
            "success": True,
            "message": "Backup routine initiated."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/restore")
async def restore_backup(payload: BackupActionRequest):
    if backup_service.backup_status["is_busy"]:
        raise HTTPException(status_code=400, detail="A backup or restore operation is already in progress.")
    try:
        backup_service.run_restore_routine(server_manager, payload.filename)
        return {
            "success": True,
            "message": f"Restore routine for '{payload.filename}' initiated."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/delete")
async def delete_backup(payload: BackupActionRequest):
    if backup_service.backup_status["is_busy"]:
        raise HTTPException(status_code=400, detail="Cannot delete backups while a backup/restore is in progress.")
    try:
        return backup_service.delete_backup_file(payload.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
