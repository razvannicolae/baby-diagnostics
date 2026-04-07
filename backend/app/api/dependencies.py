"""FastAPI dependencies — DB session and auth."""

import uuid

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError
from app.core.security import verify_access_token
from app.db.models.user import User
from app.db.session import get_db
from app.repositories import user_repo


async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and verify JWT from Authorization header, return the user."""
    if not authorization.startswith("Bearer "):
        raise AuthenticationError("Invalid authorization header")

    token = authorization[7:]
    user_id: uuid.UUID | None = verify_access_token(token)
    if user_id is None:
        raise AuthenticationError("Invalid or expired token")

    user = await user_repo.get_by_id(db, user_id)
    if user is None:
        raise AuthenticationError("User not found")

    return user
