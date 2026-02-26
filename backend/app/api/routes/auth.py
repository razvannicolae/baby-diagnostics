"""Auth routes — Google Sign-In verification and JWT issuance."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.repositories import user_repo
from app.schemas.auth import GoogleLoginRequest
from app.schemas.user import UserResponse
from app.services.auth_service import authenticate_google_user

router = APIRouter(prefix="/auth")


def _user_token_response(user: object) -> dict:
    """Build a token response dict from a User model."""
    from app.db.models.user import User

    u: User = user  # type: ignore[assignment]
    access_token = create_access_token(u.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=str(u.id),
            email=u.email,
            display_name=u.display_name,
            avatar_url=u.avatar_url,
        ).model_dump(),
    }


@router.post("/google")
async def google_login(
    body: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Verify Google ID token and return an app JWT."""
    user = await authenticate_google_user(db, body.token)
    return _user_token_response(user)


@router.post("/dev-login")
async def dev_login(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Dev-only: create or fetch a dev user and return a real JWT."""
    if settings.is_production:
        from app.core.exceptions import AuthorizationError

        raise AuthorizationError("Dev login disabled in production")

    user = await user_repo.get_by_google_id(db, "dev-google-id")
    if user:
        user.last_login_at = datetime.now(timezone.utc)
        await db.flush()
    else:
        user = await user_repo.create(
            db,
            google_id="dev-google-id",
            email="dev@babybio.local",
            display_name="Dev User",
        )
    return _user_token_response(user)
