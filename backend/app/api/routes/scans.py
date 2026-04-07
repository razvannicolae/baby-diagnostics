"""Scan history routes."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.exceptions import AuthorizationError, NotFoundError
from app.db.models.user import User
from app.db.session import get_db
from app.repositories import scan_repo
from app.schemas.scan import BiomarkerResponse, ScanResponse

router = APIRouter(prefix="/scans")


def _to_response(scan: object) -> ScanResponse:
    """Convert a Scan model to ScanResponse."""
    from app.db.models.scan import Scan as ScanModel

    s: ScanModel = scan  # type: ignore[assignment]
    return ScanResponse(
        id=str(s.id),
        baby_id=str(s.baby_id),
        status=s.status,
        confidence=s.confidence,
        biomarkers=[
            BiomarkerResponse(
                marker_name=b.marker_name,
                value=b.value,
                numeric_value=b.numeric_value,
                category=b.category,
                is_flagged=b.is_flagged,
                reference_range=b.reference_range,
            )
            for b in s.biomarkers
        ],
        created_at=s.created_at.isoformat(),
        notes=s.notes,
    )


@router.get("", response_model=list[ScanResponse])
async def list_scans(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ScanResponse]:
    """List all scans for the authenticated user."""
    scans = await scan_repo.list_by_user(db, user.id)
    return [_to_response(s) for s in scans]


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(
    scan_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ScanResponse:
    """Get a scan by ID with biomarker results."""
    scan = await scan_repo.get_by_id(db, scan_id)
    if not scan:
        raise NotFoundError("Scan not found")
    if scan.user_id != user.id:
        raise AuthorizationError()
    return _to_response(scan)


@router.delete("/{scan_id}", status_code=204)
async def delete_scan(
    scan_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a scan."""
    scan = await scan_repo.get_by_id(db, scan_id)
    if not scan:
        raise NotFoundError("Scan not found")
    if scan.user_id != user.id:
        raise AuthorizationError()
    await scan_repo.delete(db, scan)
