from fastapi import APIRouter, HTTPException, Request
from app.services import mrpack

router = APIRouter(prefix="/api/mrpack", tags=["mrpack"])

@router.get("/instance")
async def get_instance():
    instance = mrpack.get_current_instance()
    return {"instance": instance}

@router.post("/upload")
async def upload_mrpack(request: Request):
    try:
        # Read raw binary payload of the uploaded .mrpack archive
        file_bytes = await request.body()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="No file data received.")
        
        result = mrpack.install_mrpack(file_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
