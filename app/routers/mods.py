import asyncio
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.services import modrinth

router = APIRouter(prefix="/api/mods", tags=["mods"])

class InstallModRequest(BaseModel):
    project_id_or_slug: Optional[str] = None
    project_id: Optional[str] = None
    mc_version: Optional[str] = None
    loader: Optional[str] = None

class UninstallModRequest(BaseModel):
    filename: Optional[str] = None

class ToggleModRequest(BaseModel):
    filename: Optional[str] = None

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
    for m in installed:
        if "size" not in m and "size_bytes" in m:
            m["size"] = m["size_bytes"]
    return {"installed": installed, "mods": installed}

@router.post("/install/{project_id_or_slug}")
@router.post("/install")
async def install_mod(
    project_id_or_slug: Optional[str] = None,
    mc_version: Optional[str] = Query(None),
    loader: Optional[str] = Query(None),
    payload: Optional[InstallModRequest] = None
):
    try:
        pid = project_id_or_slug or (payload.project_id_or_slug if payload else None) or (payload.project_id if payload else None)
        mc = mc_version or (payload.mc_version if payload else None) or "1.20.1"
        mod_loader = loader or (payload.loader if payload else None) or "fabric"

        if not pid:
            raise HTTPException(status_code=400, detail="Missing project_id or slug")

        res = await asyncio.to_thread(
            modrinth.install_mod,
            project_id_or_slug=pid,
            mc_version=mc,
            loader=mod_loader
        )
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/installed/{filename}")
@router.post("/uninstall")
async def uninstall_mod(filename: Optional[str] = None, payload: Optional[UninstallModRequest] = None):
    try:
        fname = filename or (payload.filename if payload else None)
        if not fname:
            raise HTTPException(status_code=400, detail="Missing filename")
        return await asyncio.to_thread(modrinth.uninstall_mod, fname)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/installed/{filename}/enable")
@router.post("/installed/{filename}/disable")
@router.post("/toggle")
async def toggle_mod(filename: Optional[str] = None, payload: Optional[ToggleModRequest] = None):
    try:
        fname = filename or (payload.filename if payload else None)
        if not fname:
            raise HTTPException(status_code=400, detail="Missing filename")
        return await asyncio.to_thread(modrinth.toggle_mod, fname)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
