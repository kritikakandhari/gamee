"""
User-related schemas.
"""
from typing import Optional
from pydantic import BaseModel
from uuid import UUID


class UpdateProfileRequest(BaseModel):
    """Update profile request."""
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None
