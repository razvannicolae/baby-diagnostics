"""Analysis service — orchestrates image analysis and persistence."""

import hashlib
import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import AuthorizationError, NotFoundError
from app.cv.analyzer import analyze_strip
from app.db.models.biomarker import BiomarkerReading
from app.db.models.scan import Scan
from app.db.models.user import User
from app.repositories import baby_repo

logger = logging.getLogger(__name__)


async def analyze_image(
    db: AsyncSession,
    user: User,
    baby_id: uuid.UUID,
    image_data: bytes,
) -> dict:
    """Validate ownership, run CV pipeline, persist results.

    Returns a dict matching the AnalysisResponse schema shape.
    """
    # Verify baby belongs to user
    baby = await baby_repo.get_by_id(db, baby_id)
    if baby is None:
        raise NotFoundError("Baby not found")
    if baby.user_id != user.id:
        raise AuthorizationError("You do not have access to this baby profile")

    # Hash image for audit (never store actual image)
    image_hash = hashlib.sha256(image_data).hexdigest()

    # Run CV pipeline (synchronous, CPU-bound)
    analysis = analyze_strip(image_data, settings.calibration_path)

    # Persist scan
    scan = Scan(
        baby_id=baby_id,
        user_id=user.id,
        status=analysis.status,
        confidence=analysis.confidence,
        image_hash=image_hash,
    )
    db.add(scan)
    await db.flush()

    # Persist biomarker readings
    for bio in analysis.biomarkers:
        reading = BiomarkerReading(
            scan_id=scan.id,
            marker_name=bio.marker_name,
            value=bio.value,
            numeric_value=bio.numeric_value,
            category=bio.category,
            is_flagged=bio.is_flagged,
            reference_range=bio.reference_range,
        )
        db.add(reading)
    await db.flush()

    return {
        "scan_id": str(scan.id),
        "status": scan.status,
        "confidence": scan.confidence,
        "biomarkers": [
            {
                "marker_name": bio.marker_name,
                "value": bio.value,
                "numeric_value": bio.numeric_value,
                "category": bio.category,
                "is_flagged": bio.is_flagged,
                "reference_range": bio.reference_range,
            }
            for bio in analysis.biomarkers
        ],
        "created_at": scan.created_at.isoformat(),
    }
