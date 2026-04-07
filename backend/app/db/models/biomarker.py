import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BiomarkerReading(Base):
    __tablename__ = "biomarker_readings"
    __table_args__ = (
        UniqueConstraint("scan_id", "marker_name"),
        Index("idx_biomarkers_scan_id", "scan_id"),
    )

    scan_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("scans.id", ondelete="CASCADE"),
        nullable=False,
    )
    marker_name: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[str] = mapped_column(String(50), nullable=False)
    numeric_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    is_flagged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reference_range: Mapped[str | None] = mapped_column(String(100), nullable=True)

    scan: Mapped["Scan"] = relationship(back_populates="biomarkers")  # noqa: F821
