"""
User endpoints.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, status
from typing import Optional

from app.domain.repositories.user_repository import UserRepository
from app.api.deps import get_user_repository, get_current_user
from app.domain.entities.user import User, PlayerProfile
from app.schemas.auth import ProfileResponse, UserResponse
from app.schemas.user import UpdateProfileRequest
from app.core.exceptions import NotFoundError

router = APIRouter()


@router.get("/{user_id}", response_model=UserResponse, summary="Get user profile (public data only)")
async def get_user(
    user_id: UUID,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Get user profile (public data only)."""
    user = await user_repo.get_user_by_id(user_id)
    
    if not user:
        raise NotFoundError("User", str(user_id))
    
    return UserResponse(
        id=user.id,
        email=user.email,
        email_verified=user.email_verified,
        account_status=user.account_status
    )


@router.put("/me", response_model=ProfileResponse, summary="Update current user's profile")
async def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Update current user's profile."""
    
    profile = await user_repo.get_profile_by_user_id(current_user.id)
    
    if not profile:
        raise NotFoundError("Profile", str(current_user.id))
    
    # Update only provided fields
    if request.display_name is not None:
        profile.display_name = request.display_name
    if request.bio is not None:
        profile.bio = request.bio
    if request.avatar_url is not None:
        profile.avatar_url = request.avatar_url
    if request.timezone is not None:
        profile.timezone = request.timezone
    
    updated_profile = await user_repo.update_profile(profile)
    
    return ProfileResponse(
        id=updated_profile.id,
        user_id=updated_profile.user_id,
        username=updated_profile.username,
        display_name=updated_profile.display_name,
        avatar_url=updated_profile.avatar_url,
        region=updated_profile.region
    )
