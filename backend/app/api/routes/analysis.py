"""Analysis route — POST /api/analyze for image analysis."""

import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.exceptions import ValidationError
from app.db.models.user import User
from app.db.session import get_db
from app.middleware.rate_limiter import limiter
from app.services import analysis_service

router = APIRouter()

_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}
_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/analyze")
async def analyze_image(
    baby_id: str = Form(...),
    image: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Upload a test strip image for CV analysis."""
    limiter.check(f"analysis:{user.id}", limit=10, window=60)

    # Validate content type
    if image.content_type not in _ALLOWED_CONTENT_TYPES:
        raise ValidationError("Only JPEG and PNG images are accepted")

    # Read and validate size
    image_data = await image.read()
    if len(image_data) > _MAX_FILE_SIZE:
        raise ValidationError("Image exceeds maximum size of 10MB")

    # Validate baby_id format
    try:
        parsed_baby_id = uuid.UUID(baby_id)
    except ValueError:
        raise ValidationError("Invalid baby ID format")

    return await analysis_service.analyze_image(db, user, parsed_baby_id, image_data)
