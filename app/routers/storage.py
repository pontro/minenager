from fastapi import APIRouter, HTTPException
from app.services import storage as storage_service

router = APIRouter(prefix="/api/storage", tags=["storage"])

@router.get("")
async def get_storage():
    """Get storage breakdown across world, backups, mods, logs, and free disk."""
    try:
        return storage_service.get_storage_breakdown()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clean-logs")
async def clean_logs():
    """Purge old archived log files (.log.gz) and crash dumps."""
    try:
        return storage_service.clean_old_logs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
