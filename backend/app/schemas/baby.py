"""Baby profile schemas."""

from datetime import date

from pydantic import BaseModel


class BabyCreate(BaseModel):
    name: str
    date_of_birth: date | None = None
    notes: str | None = None


class BabyUpdate(BaseModel):
    name: str | None = None
    date_of_birth: date | None = None
    notes: str | None = None


class BabyResponse(BaseModel):
    id: str
    name: str
    date_of_birth: date | None
    notes: str | None
    created_at: str

    model_config = {"from_attributes": True}
