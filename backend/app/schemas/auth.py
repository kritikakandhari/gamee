"""
Authentication request/response schemas.
"""
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator
from uuid import UUID


class RegisterRequest(BaseModel):
    """User registration request."""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    username: str = Field(..., min_length=3, max_length=50, description="Username must be 3-50 characters")
    display_name: Optional[str] = Field(None, max_length=100)
    
    @validator("username")
    def validate_username(cls, v):
        """Validate username format."""
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")
        return v


class LoginRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str


class LogoutRequest(BaseModel):
    """Logout request."""
    refresh_token: str


class TokenResponse(BaseModel):
    """Token response."""
    access_token: str
    refresh_token: str
    expires_in: int = 900  # 15 minutes in seconds
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User response (public data)."""
    id: UUID
    email: str
    email_verified: bool
    account_status: str
    
    class Config:
        from_attributes = True


class ProfileResponse(BaseModel):
    """Player profile response."""
    id: UUID
    user_id: UUID
    username: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    region: str
    
    class Config:
        from_attributes = True


class RegisterResponse(BaseModel):
    """Registration response."""
    user: UserResponse
    profile: ProfileResponse
    access_token: str
    refresh_token: str
    expires_in: int = 900


class LoginResponse(BaseModel):
    """Login response."""
    user: UserResponse
    profile: ProfileResponse
    access_token: str
    refresh_token: str
    expires_in: int = 900


class CurrentUserResponse(BaseModel):
    """Current user response."""
    user: UserResponse
    profile: ProfileResponse
    roles: List[str] = []
