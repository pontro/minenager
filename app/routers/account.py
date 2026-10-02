from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services import license as license_service

router = APIRouter(prefix="/api/account", tags=["account"])

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None
    tier: Optional[str] = "pro"

@router.get("/status")
async def get_status():
    return license_service.get_account_status()

@router.post("/login")
async def login(payload: LoginRequest):
    if not payload.email or "@" not in payload.email:
        raise HTTPException(status_code=400, detail="Invalid email address.")
    
    # In Phase 1 local simulation, logging in grants Pro status to preview and test all features
    res = license_service.save_account_session(
        email=payload.email.strip(),
        tier=payload.tier or "pro"
    )
    return res

@router.post("/logout")
async def logout():
    return license_service.clear_account_session()
