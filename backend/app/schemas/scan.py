"""Scan and biomarker response schemas."""

from pydantic import BaseModel


class BiomarkerResponse(BaseModel):
    marker_name: str
    value: str
    numeric_value: float | None
    category: str
    is_flagged: bool
    reference_range: str | None

    model_config = {"from_attributes": True}


class ScanResponse(BaseModel):
    id: str
    baby_id: str
    status: str
    confidence: float
    biomarkers: list[BiomarkerResponse]
    created_at: str
    notes: str | None

    model_config = {"from_attributes": True}
