from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    """Health check that verifies database connectivity."""
    try:
        await db.execute(text("SELECT 1"))
        return HealthResponse(status="healthy", database="connected")
    except Exception:
        return HealthResponse(status="degraded", database="disconnected")
