import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Scan(Base):
    __tablename__ = "scans"
    __table_args__ = (
        Index("idx_scans_baby_id", "baby_id"),
        Index("idx_scans_user_id_created", "user_id", "created_at"),
    )

    baby_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("babies.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="normal",
    )
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    image_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    baby: Mapped["Baby"] = relationship(back_populates="scans")  # noqa: F821
    user: Mapped["User"] = relationship(back_populates="scans")  # noqa: F821
    biomarkers: Mapped[list["BiomarkerReading"]] = relationship(  # noqa: F821
        back_populates="scan",
        cascade="all, delete-orphan",
    )
    chat_messages: Mapped[list["ChatMessage"]] = relationship(  # noqa: F821
        back_populates="scan",
        cascade="all, delete-orphan",
    )
