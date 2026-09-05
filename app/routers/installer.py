import asyncio
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.services import downloader, mrpack

router = APIRouter(prefix="/api/installer", tags=["installer"])

class InstallServerRequest(BaseModel):
    mc_version: Optional[str] = None
    minecraft_version: Optional[str] = None
    loader: str
    loader_version: Optional[str] = None

@router.get("/loader-versions")
async def get_loader_versions(
    version: str = Query(..., description="Minecraft version"),
    loader: str = Query("fabric", description="Mod loader")
):
    try:
        versions = await asyncio.to_thread(downloader.get_loader_versions, version, loader)
        return {"versions": versions, "loader_versions": versions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/install")
async def install_server(payload: InstallServerRequest):
    try:
        mc = payload.mc_version or payload.minecraft_version or "1.20.1"
        res = await asyncio.to_thread(
            downloader.install_custom_server,
            mc_version=mc,
            loader=payload.loader,
            loader_version=payload.loader_version
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/instance")
async def get_current_instance():
    return {"instance": mrpack.get_current_instance()}
