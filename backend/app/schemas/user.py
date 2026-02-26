"""User response schemas."""

from pydantic import BaseModel


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    avatar_url: str | None

    model_config = {"from_attributes": True}
