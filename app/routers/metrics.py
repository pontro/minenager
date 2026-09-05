import asyncio
from fastapi import APIRouter
from app.services.metrics import metrics_service

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

@router.get("/live")
async def get_live_metrics():
    """Get instant live CPU, RAM, TPS, and host metrics."""
    return await asyncio.to_thread(metrics_service.get_live_metrics)

@router.get("/history")
async def get_metrics_history():
    """Get rolling 60-second history buffer for chart visualization."""
    return {"history": await asyncio.to_thread(metrics_service.get_history)}
