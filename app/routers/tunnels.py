from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.tunnel import Tunnel, TunnelMetrics
from app.schemas.tunnel import TunnelResponse, TunnelStatusUpdate

router = APIRouter(prefix="/tunnels", tags=["tunnels"])

@router.get("/config", response_model=TunnelResponse)
async def get_tunnel_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.tier != "pro":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Minenager Tunnel relay is a Pro feature. Please upgrade to activate zero-portforward tunneling."
        )

    stmt = select(Tunnel).where(Tunnel.user_id == current_user.id)
    res = await db.execute(stmt)
    tunnel = res.scalars().first()

    if not tunnel:
        raise HTTPException(status_code=404, detail="No tunnel allocated for user.")

    public_addr = f"{tunnel.subdomain}.{settings.TUNNEL_RELAY_HOST}:{tunnel.public_port}"
    relay_control = f"{settings.TUNNEL_RELAY_HOST}:{settings.TUNNEL_RELAY_CONTROL_PORT}"

    return TunnelResponse(
        id=tunnel.id,
        subdomain=tunnel.subdomain,
        public_address=public_addr,
        relay_server_address=relay_control,
        tunnel_secret_token=tunnel.tunnel_secret_token,
        is_online=tunnel.is_online,
        last_heartbeat=tunnel.last_heartbeat
    )

@router.post("/status/{tunnel_token}")
async def update_tunnel_status(
    tunnel_token: str,
    payload: TunnelStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Tunnel).where(Tunnel.tunnel_secret_token == tunnel_token)
    res = await db.execute(stmt)
    tunnel = res.scalars().first()

    if not tunnel:
        raise HTTPException(status_code=404, detail="Tunnel token invalid.")

    tunnel.is_online = payload.is_online
    tunnel.last_heartbeat = datetime.utcnow()

    if payload.bytes_in or payload.bytes_out or payload.peak_players:
        metric = TunnelMetrics(
            tunnel_id=tunnel.id,
            bytes_in=payload.bytes_in or 0,
            bytes_out=payload.bytes_out or 0,
            peak_players=payload.peak_players or 0
        )
        db.add(metric)

    await db.commit()
    return {"status": "ok", "is_online": tunnel.is_online}
