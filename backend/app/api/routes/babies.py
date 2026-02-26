"""Baby profile CRUD routes."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.exceptions import AuthorizationError, NotFoundError
from app.db.models.user import User
from app.db.session import get_db
from app.repositories import baby_repo
from app.schemas.baby import BabyCreate, BabyResponse, BabyUpdate

router = APIRouter(prefix="/babies")


def _to_response(baby: object) -> BabyResponse:
    """Convert a Baby model to BabyResponse."""
    from app.db.models.baby import Baby as BabyModel

    b: BabyModel = baby  # type: ignore[assignment]
    return BabyResponse(
        id=str(b.id),
        name=b.name,
        date_of_birth=b.date_of_birth,
        notes=b.notes,
        created_at=b.created_at.isoformat(),
    )


@router.get("", response_model=list[BabyResponse])
async def list_babies(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BabyResponse]:
    """List all baby profiles for the authenticated user."""
    babies = await baby_repo.list_by_user(db, user.id)
    return [_to_response(b) for b in babies]


@router.post("", response_model=BabyResponse, status_code=201)
async def create_baby(
    body: BabyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BabyResponse:
    """Create a new baby profile."""
    baby = await baby_repo.create(
        db,
        user_id=user.id,
        name=body.name,
        date_of_birth=body.date_of_birth,
        notes=body.notes,
    )
    return _to_response(baby)


@router.get("/{baby_id}", response_model=BabyResponse)
async def get_baby(
    baby_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BabyResponse:
    """Get a baby profile by ID."""
    baby = await baby_repo.get_by_id(db, baby_id)
    if not baby:
        raise NotFoundError("Baby not found")
    if baby.user_id != user.id:
        raise AuthorizationError()
    return _to_response(baby)


@router.put("/{baby_id}", response_model=BabyResponse)
async def update_baby(
    baby_id: uuid.UUID,
    body: BabyUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BabyResponse:
    """Update a baby profile."""
    baby = await baby_repo.get_by_id(db, baby_id)
    if not baby:
        raise NotFoundError("Baby not found")
    if baby.user_id != user.id:
        raise AuthorizationError()
    updated = await baby_repo.update(
        db,
        baby,
        name=body.name,
        date_of_birth=body.date_of_birth,
        notes=body.notes,
    )
    return _to_response(updated)


@router.delete("/{baby_id}", status_code=204)
async def delete_baby(
    baby_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a baby profile."""
    baby = await baby_repo.get_by_id(db, baby_id)
    if not baby:
        raise NotFoundError("Baby not found")
    if baby.user_id != user.id:
        raise AuthorizationError()
    await baby_repo.delete(db, baby)
