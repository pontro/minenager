from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.tunnel import Tunnel
from app.schemas.auth import RegisterRequest, LoginRequest, UserResponse, TokenResponse
import secrets

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    clean_username = payload.username.strip().lower()
    clean_email = payload.email.strip().lower()

    # Check username & email uniqueness
    stmt = select(User).where(or_(
        func.lower(User.username) == clean_username,
        func.lower(User.email) == clean_email
    ))
    res = await db.execute(stmt)
    existing = res.scalars().first()
    if existing:
        if existing.username.lower() == clean_username:
            raise HTTPException(status_code=400, detail="Username is already taken.")
        raise HTTPException(status_code=400, detail="Email is already registered.")

    new_user = User(
        username=clean_username,
        email=clean_email,
        password_hash=hash_password(payload.password),
        tier="free",
        is_active=True
    )
    db.add(new_user)
    await db.flush()

    # Automatically provision a free/inactive tunnel placeholder for when they upgrade
    # Find next available port starting from 25565
    port_stmt = select(func.coalesce(func.max(Tunnel.public_port), 25564))
    port_res = await db.execute(port_stmt)
    max_port = port_res.scalar_one()
    next_port = max(25565, max_port + 1)

    new_tunnel = Tunnel(
        user_id=new_user.id,
        subdomain=clean_username,
        public_port=next_port,
        target_local_port=25565,
        tunnel_secret_token=secrets.token_hex(24),
        is_online=False
    )
    db.add(new_tunnel)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token({
        "sub": str(new_user.id),
        "username": new_user.username,
        "email": new_user.email,
        "tier": new_user.tier
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    ident = payload.username_or_email.strip().lower()
    stmt = select(User).where(or_(
        func.lower(User.username) == ident,
        func.lower(User.email) == ident
    ))
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled.")

    token = create_access_token({
        "sub": str(user.id),
        "username": user.username,
        "email": user.email,
        "tier": user.tier
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

