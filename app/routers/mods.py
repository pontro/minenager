import asyncio
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.services import modrinth

router = APIRouter(prefix="/api/mods", tags=["mods"])

class InstallModRequest(BaseModel):
    project_id_or_slug: str
    mc_version: str
    loader: str

class UninstallModRequest(BaseModel):
    filename: str

class ToggleModRequest(BaseModel):
    filename: str

@router.get("/versions")
async def get_versions():
    versions = await asyncio.to_thread(modrinth.get_minecraft_versions)
    return {"versions": versions}

@router.get("/loaders")
async def get_loaders():
    return {"loaders": modrinth.get_loaders()}

@router.get("/search")
async def search_mods(
    q: str = "",
    version: Optional[str] = None,
    loader: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50)
):
    hits = await asyncio.to_thread(modrinth.search_mods, query=q, mc_version=version, loader=loader, limit=limit)
    return {"hits": hits}

@router.get("/installed")
async def get_installed():
    installed = await asyncio.to_thread(modrinth.list_installed_mods)
    return {"installed": installed}

@router.post("/install")
async def install_mod(payload: InstallModRequest):
    try:
        res = await asyncio.to_thread(
            modrinth.install_mod,
            project_id_or_slug=payload.project_id_or_slug,
            mc_version=payload.mc_version,
            loader=payload.loader
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/uninstall")
async def uninstall_mod(payload: UninstallModRequest):
    try:
        return await asyncio.to_thread(modrinth.uninstall_mod, payload.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/toggle")
async def toggle_mod(payload: ToggleModRequest):
    try:
        return await asyncio.to_thread(modrinth.toggle_mod, payload.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
