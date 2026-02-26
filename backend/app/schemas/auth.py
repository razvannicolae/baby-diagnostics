"""Auth request/response schemas."""

from pydantic import BaseModel


class GoogleLoginRequest(BaseModel):
    token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
