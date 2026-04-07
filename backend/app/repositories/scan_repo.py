"""Scan repository — DB queries for Scan model."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.scan import Scan


async def list_by_user(db: AsyncSession, user_id: uuid.UUID) -> list[Scan]:
    """List all scans for a user, with biomarkers eagerly loaded."""
    result = await db.execute(
        select(Scan)
        .where(Scan.user_id == user_id)
        .options(selectinload(Scan.biomarkers))
        .order_by(Scan.created_at.desc())
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, scan_id: uuid.UUID) -> Scan | None:
    """Get a scan by ID with biomarkers eagerly loaded."""
    result = await db.execute(
        select(Scan)
        .where(Scan.id == scan_id)
        .options(selectinload(Scan.biomarkers))
    )
    return result.scalar_one_or_none()


async def delete(db: AsyncSession, scan: Scan) -> None:
    """Delete a scan."""
    await db.delete(scan)
    await db.flush()
