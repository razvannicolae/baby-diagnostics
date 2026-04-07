"""Analysis service — orchestrates image analysis and persistence."""

import hashlib
import logging
import random
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.cv.analyzer import AnalysisResult, BiomarkerResult, analyze_strip
from app.db.models.biomarker import BiomarkerReading
from app.db.models.scan import Scan
from app.db.models.user import User
from app.repositories import baby_repo

logger = logging.getLogger(__name__)


def _generate_mock_results() -> AnalysisResult:
    """Generate mock biomarker results for development testing."""
    markers = [
        ("pH", 5.0, 7.0, ""),
        ("creatinine", 0.2, 0.8, "mg/dL"),
        ("vitamin_a", 20.0, 60.0, "mcg/dL"),
        ("vitamin_d", 30.0, 80.0, "ng/mL"),
    ]
    results: list[BiomarkerResult] = []
    for name, normal_min, normal_max, unit in markers:
        value = round(random.uniform(normal_min * 0.8, normal_max * 1.2), 1)
        category = "normal" if normal_min <= value <= normal_max else ("low" if value < normal_min else "high")
        is_flagged = category != "normal"
        ref_range = f"{normal_min}-{normal_max}"
        if unit:
            ref_range += f" {unit}"
        display_value = f"{value} {unit}".strip() if unit else str(value)
        results.append(BiomarkerResult(
            marker_name=name,
            value=display_value,
            numeric_value=value,
            category=category,
            is_flagged=is_flagged,
            reference_range=ref_range,
            confidence=round(random.uniform(0.7, 0.95), 3),
        ))

    any_flagged = any(r.is_flagged for r in results)
    avg_confidence = sum(r.confidence for r in results) / len(results)
    return AnalysisResult(
        status="attention_needed" if any_flagged else "normal",
        confidence=round(avg_confidence, 3),
        biomarkers=results,
    )


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
    try:
        analysis = analyze_strip(image_data, settings.calibration_path)
    except ValidationError:
        if settings.is_production:
            raise
        logger.warning("Strip detection failed — using mock results (dev mode)")
        analysis = _generate_mock_results()

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
