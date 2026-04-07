"""Chat repository — DB queries for ChatMessage model."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.chat import ChatMessage


async def list_by_scan(db: AsyncSession, scan_id: uuid.UUID) -> list[ChatMessage]:
    """List all messages for a scan, ordered chronologically."""
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.scan_id == scan_id)
        .order_by(ChatMessage.created_at.asc())
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    *,
    scan_id: uuid.UUID,
    user_id: uuid.UUID,
    role: str,
    content: str,
) -> ChatMessage:
    """Create a new chat message."""
    message = ChatMessage(
        scan_id=scan_id,
        user_id=user_id,
        role=role,
        content=content,
    )
    db.add(message)
    await db.flush()
    return message
