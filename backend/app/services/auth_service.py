"""Auth service — Google token verification and user upsert."""

from datetime import datetime, timezone

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import AuthenticationError
from app.db.models.user import User
from app.repositories import user_repo


async def verify_google_token(token: str) -> dict[str, str]:
    """Verify a Google ID token and return user info.

    Returns dict with keys: sub, email, name, picture.
    """
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.google_client_id,
        )
        return {
            "sub": idinfo["sub"],
            "email": idinfo["email"],
            "name": idinfo.get("name", idinfo["email"]),
            "picture": idinfo.get("picture"),
        }
    except ValueError as e:
        raise AuthenticationError(f"Invalid Google token: {e}") from e


async def authenticate_google_user(db: AsyncSession, google_token: str) -> User:
    """Verify Google token and create or update the user."""
    google_info = await verify_google_token(google_token)

    user = await user_repo.get_by_google_id(db, google_info["sub"])

    if user:
        user.last_login_at = datetime.now(timezone.utc)
        user.display_name = google_info["name"]
        if google_info.get("picture"):
            user.avatar_url = google_info["picture"]
        await db.flush()
    else:
        user = await user_repo.create(
            db,
            google_id=google_info["sub"],
            email=google_info["email"],
            display_name=google_info["name"],
            avatar_url=google_info.get("picture"),
        )

    return user
