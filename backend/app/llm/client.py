"""Anthropic LLM client for streaming responses."""

from collections.abc import AsyncGenerator

import anthropic

from app.config import settings


class LLMClient:
    """Async wrapper around the Anthropic API for streaming chat."""

    def __init__(self) -> None:
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def stream_response(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        """Stream tokens from Claude Haiku.

        Yields individual text chunks as they arrive.
        """
        async with self._client.messages.stream(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            temperature=0.3,
            system=system_prompt,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield text


# Global singleton
llm_client = LLMClient()
