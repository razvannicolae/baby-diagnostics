"""User repository — DB queries for User model."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User


async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    """Get a user by primary key."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_by_google_id(db: AsyncSession, google_id: str) -> User | None:
    """Get a user by Google ID."""
    result = await db.execute(select(User).where(User.google_id == google_id))
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession,
    *,
    google_id: str,
    email: str,
    display_name: str,
    avatar_url: str | None = None,
) -> User:
    """Create a new user."""
    user = User(
        google_id=google_id,
        email=email,
        display_name=display_name,
        avatar_url=avatar_url,
    )
    db.add(user)
    await db.flush()
    return user


async def update(db: AsyncSession, user: User, **kwargs: str | None) -> User:
    """Update user fields."""
    for key, value in kwargs.items():
        if hasattr(user, key):
            setattr(user, key, value)
    await db.flush()
    return user
