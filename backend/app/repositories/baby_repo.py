"""Baby repository — DB queries for Baby model."""

import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.baby import Baby


async def list_by_user(db: AsyncSession, user_id: uuid.UUID) -> list[Baby]:
    """List all babies for a user."""
    result = await db.execute(
        select(Baby).where(Baby.user_id == user_id).order_by(Baby.created_at.desc())
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, baby_id: uuid.UUID) -> Baby | None:
    """Get a baby by ID."""
    result = await db.execute(select(Baby).where(Baby.id == baby_id))
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    name: str,
    date_of_birth: date | None = None,
    notes: str | None = None,
) -> Baby:
    """Create a new baby profile."""
    baby = Baby(
        user_id=user_id,
        name=name,
        date_of_birth=date_of_birth,
        notes=notes,
    )
    db.add(baby)
    await db.flush()
    return baby


async def update(db: AsyncSession, baby: Baby, **kwargs: object) -> Baby:
    """Update baby fields."""
    for key, value in kwargs.items():
        if value is not None and hasattr(baby, key):
            setattr(baby, key, value)
    await db.flush()
    return baby


async def delete(db: AsyncSession, baby: Baby) -> None:
    """Delete a baby profile."""
    await db.delete(baby)
    await db.flush()
