from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Base application error."""

    def __init__(self, message: str = "An unexpected error occurred", status_code: int = 500) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AuthenticationError(AppError):
    def __init__(self, message: str = "Authentication required") -> None:
        super().__init__(message=message, status_code=401)


class AuthorizationError(AppError):
    def __init__(self, message: str = "Permission denied") -> None:
        super().__init__(message=message, status_code=403)


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message=message, status_code=404)


class ValidationError(AppError):
    def __init__(self, message: str = "Validation failed") -> None:
        super().__init__(message=message, status_code=422)


class RateLimitError(AppError):
    def __init__(self, message: str = "Rate limit exceeded") -> None:
        super().__init__(message=message, status_code=429)


async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    """Global handler for AppError exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


async def unhandled_error_handler(_request: Request, _exc: Exception) -> JSONResponse:
    """Global handler for unexpected exceptions. Never expose stack traces."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
