from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.routes.chat import router as chat_router
from app.config import settings
from app.core.exceptions import AppError, app_error_handler, unhandled_error_handler
from app.db.session import engine
from app.middleware.security_headers import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifecycle — dispose DB engine on shutdown."""
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    application = FastAPI(
        title="Baby Diagnostics API",
        version="0.1.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    # Security headers
    application.add_middleware(SecurityHeadersMiddleware)

    # CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

    # Exception handlers
    application.add_exception_handler(AppError, app_error_handler)  # type: ignore[arg-type]
    application.add_exception_handler(Exception, unhandled_error_handler)

    # Routes
    application.include_router(api_router)
    application.include_router(chat_router)  # WebSocket mounted at root, not under /api

    return application


app = create_app()
