from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.services import license as license_service

router = APIRouter(prefix="/api/account", tags=["account"])

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

@router.get("/status")
async def get_status():
    return license_service.get_account_status()

@router.post("/login")
async def login(payload: LoginRequest):
    if not payload.username_or_email or not payload.password:
        raise HTTPException(status_code=400, detail="Username/email and password are required.")
    try:
        res = license_service.authenticate_account(
            identifier=payload.username_or_email,
            password=payload.password
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/register")
async def register(payload: RegisterRequest):
    if not payload.username or len(payload.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if not payload.email or "@" not in payload.email:
        raise HTTPException(status_code=400, detail="A valid email address is required.")
    if not payload.password or len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    try:
        res = license_service.register_account(
            username=payload.username,
            email=payload.email,
            password=payload.password
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/logout")
async def logout():
    return license_service.clear_account_session()

@router.get("/billing/config")
async def get_billing_config():
    try:
        return license_service.get_billing_config()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/billing/create-checkout-session")
async def create_checkout_session():
    try:
        return license_service.create_stripe_checkout_session()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

