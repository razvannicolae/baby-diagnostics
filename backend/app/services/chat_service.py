"""Chat service — orchestrates LLM streaming with conversation history."""

import uuid
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, NotFoundError
from app.llm.client import llm_client
from app.llm.conversation import conversation_manager
from app.llm.prompts import build_system_prompt, format_biomarker_context
from app.middleware.rate_limiter import limiter
from app.repositories import scan_repo


async def stream_chat_response(
    db: AsyncSession,
    scan_id: uuid.UUID,
    user_id: uuid.UUID,
    user_message: str,
) -> AsyncGenerator[str, None]:
    """Process a user message and stream the LLM response.

    1. Verify scan ownership
    2. Rate-limit per user
    3. Save user message
    4. Load history + build system prompt
    5. Stream LLM response
    6. Save assistant message
    """
    # Verify scan exists and belongs to user
    scan = await scan_repo.get_by_id(db, scan_id)
    if scan is None:
        raise NotFoundError("Scan not found")
    if scan.user_id != user_id:
        raise AuthorizationError("You do not have access to this scan")

    # Rate limit: 30 messages per minute
    limiter.check(f"chat:{user_id}", limit=30, window=60)

    # Save user message
    await conversation_manager.save_message(db, scan_id, user_id, "user", user_message)
    await db.commit()

    # Build context from biomarkers
    biomarker_data = [
        {
            "marker_name": b.marker_name,
            "value": b.value,
            "category": b.category,
            "is_flagged": b.is_flagged,
            "reference_range": b.reference_range,
        }
        for b in scan.biomarkers
    ]
    system_prompt = build_system_prompt(format_biomarker_context(biomarker_data))

    # Load conversation history (including the just-saved user message)
    history = await conversation_manager.load_history(db, scan_id)

    # Stream LLM response
    full_response: list[str] = []
    async for token in llm_client.stream_response(system_prompt, history):
        full_response.append(token)
        yield token

    # Save complete assistant response
    assistant_content = "".join(full_response)
    if assistant_content:
        await conversation_manager.save_message(
            db, scan_id, user_id, "assistant", assistant_content
        )
        await db.commit()
