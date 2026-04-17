"""LLM client — streams chat completions from a local LM Studio server.

LM Studio exposes an OpenAI-compatible chat-completions endpoint at
``{LMSTUDIO_BASE_URL}/v1/chat/completions``. No API key is required: the
server runs entirely on localhost.

Qwen3 MoE models (e.g. qwen3.5-35b-a3b) stream an internal chain-of-thought
via ``reasoning_content`` before emitting the actual ``content``.  We handle
both fields: reasoning tokens are silently consumed so the connection stays
alive, and only ``content`` tokens are yielded to callers.
"""

import json
import logging
from collections.abc import AsyncGenerator

import httpx

from app.config import settings
from app.core.exceptions import AppError

logger = logging.getLogger(__name__)


class LLMClient:
    """Streams tokens from the local LM Studio server."""

    async def stream_response(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        """Stream tokens from LM Studio as they arrive.

        Yields individual text chunks parsed from the OpenAI SSE format.
        Silently consumes ``reasoning_content`` tokens produced by Qwen3's
        internal chain-of-thought so the HTTP stream stays alive during the
        model's thinking phase.
        """
        payload = {
            "model": settings.lmstudio_model,
            "messages": [{"role": "system", "content": system_prompt}, *messages],
            "stream": True,
            "temperature": 0.3,
            "max_tokens": 8192,
        }
        url = f"{settings.lmstudio_base_url}/v1/chat/completions"
        headers = {"Content-Type": "application/json"}

        try:
            # Long timeout — local models on CPU/small GPU can take minutes
            # to finish the thinking phase before producing content.
            timeout = httpx.Timeout(10.0, read=300.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream("POST", url, json=payload, headers=headers) as response:
                    response.raise_for_status()
                    thinking = True
                    async for line in response.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                        except json.JSONDecodeError:
                            continue
                        delta = chunk["choices"][0].get("delta", {})

                        # Qwen3 streams reasoning_content first, then content.
                        # We silently consume reasoning tokens (keeps the HTTP
                        # stream alive so httpx doesn't timeout).
                        if delta.get("reasoning_content"):
                            if thinking:
                                logger.debug("LLM thinking phase started")
                                thinking = False
                            continue

                        content = delta.get("content")
                        if content:
                            yield content
        except httpx.ConnectError:
            raise AppError(
                f"Could not reach LM Studio at {settings.lmstudio_base_url}. "
                "Make sure the server is running and a model is loaded."
            )
        except httpx.TimeoutError:
            raise AppError(
                "LM Studio timed out — the model may be overloaded or too large "
                "to respond in time. Try a smaller model."
            )
        except httpx.HTTPStatusError as e:
            raise AppError(f"LM Studio returned an error: {e.response.status_code}")


# Global singleton
llm_client = LLMClient()
