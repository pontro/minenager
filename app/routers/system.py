import asyncio
from fastapi import APIRouter, HTTPException
from app.services import updater

router = APIRouter(prefix="/api/system", tags=["system"])

@router.get("/version")
async def get_version():
    """Get current Minenager version and git commit."""
    try:
        return await asyncio.to_thread(updater.get_current_version)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check-update")
async def check_update():
    """Check if a newer version of Minenager is available on origin/main."""
    try:
        return await asyncio.to_thread(updater.check_for_updates)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update")
async def perform_update():
    """Pull latest changes from GitHub and reload the dashboard."""
    try:
        return await asyncio.to_thread(updater.perform_update)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
