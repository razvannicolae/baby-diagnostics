"""Chat WebSocket route — /ws/chat/{scan_id}."""

import json
import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.exceptions import AppError
from app.core.security import verify_access_token
from app.db.session import async_session_factory
from app.repositories import user_repo
from app.services import chat_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/chat/{scan_id}")
async def chat_websocket(websocket: WebSocket, scan_id: str) -> None:
    """WebSocket endpoint for streaming LLM chat about scan results.

    Auth via query param: ?token=<jwt>
    Protocol:
        Client sends: {"type": "message", "content": "..."}
        Server streams: {"type": "token", "content": "..."} ...
        Server ends with: {"type": "done"}
    """
    # Auth from query param
    token = websocket.query_params.get("token", "")
    user_id = verify_access_token(token)
    if user_id is None:
        await websocket.accept()
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    # Validate scan_id format
    try:
        parsed_scan_id = uuid.UUID(scan_id)
    except ValueError:
        await websocket.accept()
        await websocket.close(code=4002, reason="Invalid scan ID")
        return

    # Verify user exists
    async with async_session_factory() as db:
        user = await user_repo.get_by_id(db, user_id)
        if user is None:
            await websocket.accept()
            await websocket.close(code=4001, reason="User not found")
            return

    await websocket.accept()

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "content": "Invalid JSON"})
                continue

            if data.get("type") != "message" or not data.get("content", "").strip():
                await websocket.send_json({"type": "error", "content": "Invalid message format"})
                continue

            user_message = data["content"].strip()

            # Fresh DB session per message (WebSocket is long-lived)
            async with async_session_factory() as db:
                try:
                    async for token_text in chat_service.stream_chat_response(
                        db, parsed_scan_id, user_id, user_message
                    ):
                        await websocket.send_json({"type": "token", "content": token_text})
                    await websocket.send_json({"type": "done"})
                except AppError as e:
                    await websocket.send_json({"type": "error", "content": e.message})

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("WebSocket error for scan %s", scan_id)
        try:
            await websocket.close(code=1011, reason="Internal error")
        except Exception:
            pass
