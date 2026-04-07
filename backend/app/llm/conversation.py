"""Conversation manager — builds message history for LLM calls."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import chat_repo


class ConversationManager:
    """Load history from DB and format for LLM API."""

    async def load_history(
        self,
        db: AsyncSession,
        scan_id: uuid.UUID,
    ) -> list[dict[str, str]]:
        """Load chat history formatted for the Anthropic messages API."""
        messages = await chat_repo.list_by_scan(db, scan_id)
        return [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]

    async def save_message(
        self,
        db: AsyncSession,
        scan_id: uuid.UUID,
        user_id: uuid.UUID,
        role: str,
        content: str,
    ) -> None:
        """Persist a chat message."""
        await chat_repo.create(db, scan_id=scan_id, user_id=user_id, role=role, content=content)


conversation_manager = ConversationManager()
