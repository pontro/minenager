from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.services.server_process import server_manager

router = APIRouter(prefix="/api/server", tags=["server"])

class CommandRequest(BaseModel):
    command: str

@router.post("/start")
async def start_server():
    try:
        return server_manager.start()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/stop")
async def stop_server():
    try:
        return server_manager.stop()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/restart")
async def restart_server():
    try:
        return server_manager.restart()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/status")
async def get_server_status():
    return server_manager.get_status()

@router.post("/command")
async def send_command(payload: CommandRequest):
    try:
        return server_manager.send_command(payload.command)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/logs")
async def get_logs(start_index: int = Query(0, ge=0)):
    return server_manager.get_logs(start_index)
