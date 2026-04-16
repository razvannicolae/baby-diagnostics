"""LLM client — supports Anthropic Claude and local LM Studio models."""

import json
from collections.abc import AsyncGenerator

import anthropic
import httpx

from app.config import settings
from app.core.exceptions import AppError


class _AnthropicBackend:
    def __init__(self) -> None:
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def stream_response(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        async with self._client.messages.stream(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            temperature=0.3,
            system=system_prompt,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield text


class _LMStudioBackend:
    def __init__(self) -> None:
        self._headers: dict[str, str] = {"Content-Type": "application/json"}
        if settings.lmstudio_api_key:
            self._headers["Authorization"] = f"Bearer {settings.lmstudio_api_key}"

    async def stream_response(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        payload = {
            "model": settings.lmstudio_model,
            "messages": [{"role": "system", "content": system_prompt}, *messages],
            "stream": True,
            "temperature": 0.3,
            "max_tokens": 1024,
        }
        url = f"{settings.lmstudio_base_url}/v1/chat/completions"
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", url, json=payload, headers=self._headers) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        chunk = json.loads(data)
                        content = chunk["choices"][0]["delta"].get("content")
                        if content:
                            yield content
        except httpx.ConnectError:
            raise AppError(
                f"Could not reach LM Studio at {settings.lmstudio_base_url}. "
                "Make sure the server is running and a model is loaded."
            )
        except httpx.TimeoutError:
            raise AppError("LM Studio timed out — the model may be overloaded or too large to respond in time.")
        except httpx.HTTPStatusError as e:
            raise AppError(f"LM Studio returned an error: {e.response.status_code}")


class LLMClient:
    """Routes LLM calls to Anthropic or LM Studio based on LLM_PROVIDER setting."""

    def __init__(self) -> None:
        if settings.llm_provider == "lmstudio":
            self._backend: _AnthropicBackend | _LMStudioBackend = _LMStudioBackend()
        else:
            self._backend = _AnthropicBackend()

    async def stream_response(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        """Stream tokens from the configured LLM provider.

        Yields individual text chunks as they arrive.
        """
        async for text in self._backend.stream_response(system_prompt, messages):
            yield text


# Global singleton
llm_client = LLMClient()
