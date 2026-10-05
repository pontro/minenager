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
    vanilla_addr = f"{tunnel.subdomain}.{settings.TUNNEL_DOMAIN}"

    # Sync DNS SRV record for vanilla zero-port resolution
    try:
        from app.services.dns import dns_service
        dns_service.sync_srv_record(
            subdomain=tunnel.subdomain,
            target_host=settings.TUNNEL_RELAY_HOST,
            public_port=tunnel.public_port
        )
    except Exception as e:
        print(f"[Minenager Cloud API] DNS sync notice: {e}")

    return TunnelResponse(
        id=tunnel.id,
        subdomain=tunnel.subdomain,
        public_address=public_addr,
        vanilla_address=vanilla_addr,
        public_port=tunnel.public_port,
        relay_server_host=settings.TUNNEL_RELAY_HOST,
        relay_server_port=settings.TUNNEL_RELAY_CONTROL_PORT,
        relay_auth_token=settings.TUNNEL_RELAY_TOKEN,
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
    now = datetime.utcnow()
    tunnel.last_heartbeat = now

    # Fetch latest recorded metric to avoid excessive database writes on 15s heartbeats
    latest_metric_stmt = (
        select(TunnelMetrics)
        .where(TunnelMetrics.tunnel_id == tunnel.id)
        .order_by(TunnelMetrics.recorded_at.desc())
        .limit(1)
    )
    latest_metric_res = await db.execute(latest_metric_stmt)
    latest_metric = latest_metric_res.scalars().first()

    current_players = payload.peak_players or 0
    should_record = False

    if not latest_metric:
        should_record = True
    else:
        # Record if player count changed or if 5 minutes elapsed since last metric sample
        players_changed = latest_metric.peak_players != current_players
        time_elapsed = (now - latest_metric.recorded_at.replace(tzinfo=None)).total_seconds() > 300
        if players_changed or time_elapsed:
            should_record = True

    if should_record:
        metric = TunnelMetrics(
            tunnel_id=tunnel.id,
            bytes_in=payload.bytes_in or 0,
            bytes_out=payload.bytes_out or 0,
            peak_players=current_players,
            recorded_at=now
        )
        db.add(metric)

    await db.commit()
    return {"status": "ok", "is_online": tunnel.is_online}
