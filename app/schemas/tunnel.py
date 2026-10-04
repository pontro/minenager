from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class TunnelResponse(BaseModel):
    id: UUID
    subdomain: str
    public_address: str
    relay_server_address: str
    tunnel_secret_token: str
    is_online: bool
    last_heartbeat: Optional[datetime] = None

    class Config:
        from_attributes = True

class TunnelStatusUpdate(BaseModel):
    is_online: bool
    bytes_in: Optional[int] = 0
    bytes_out: Optional[int] = 0
    peak_players: Optional[int] = 0
