import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Tunnel(Base):
    __tablename__ = "tunnels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subdomain = Column(String(64), unique=True, nullable=False, index=True)
    public_port = Column(Integer, unique=True, nullable=False)
    target_local_port = Column(Integer, default=25565, nullable=False)
    tunnel_secret_token = Column(String(128), unique=True, nullable=False, index=True)
    is_online = Column(Boolean, default=False, nullable=False)
    last_heartbeat = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="tunnels")
    metrics = relationship("TunnelMetrics", back_populates="tunnel", cascade="all, delete-orphan")

class TunnelMetrics(Base):
    __tablename__ = "tunnel_metrics"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    tunnel_id = Column(UUID(as_uuid=True), ForeignKey("tunnels.id", ondelete="CASCADE"), nullable=False)
    bytes_in = Column(BigInteger, default=0, nullable=False)
    bytes_out = Column(BigInteger, default=0, nullable=False)
    peak_players = Column(Integer, default=0, nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    tunnel = relationship("Tunnel", back_populates="metrics")
