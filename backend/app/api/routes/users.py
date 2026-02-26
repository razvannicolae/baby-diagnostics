"""User routes."""

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.db.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users")


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)) -> UserResponse:
    """Return the authenticated user's profile."""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
    )
