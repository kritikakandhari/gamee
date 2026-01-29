"""
Authentication endpoints.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.session import get_db
from app.domain.repositories.user_repository import UserRepository
from app.api.deps import get_user_repository, get_current_user
from app.domain.services.auth_service import AuthService
from app.schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    TokenResponse,
    LogoutRequest,
    CurrentUserResponse
)
from app.domain.entities.user import User

router = APIRouter()


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account"
)
async def register(
    request: RegisterRequest,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Register a new user account."""
    auth_service = AuthService(user_repo)
    
    user, profile, access_token, refresh_token = await auth_service.register(
        email=request.email,
        password=request.password,
        username=request.username,
        display_name=request.display_name
    )
    
    from app.schemas.auth import UserResponse, ProfileResponse
    
    return RegisterResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            email_verified=user.email_verified,
            account_status=user.account_status
        ),
        profile=ProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            username=profile.username,
            display_name=profile.display_name,
            avatar_url=profile.avatar_url,
            region=profile.region
        ),
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=900
    )


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Authenticate and receive tokens"
)
async def login(
    request: LoginRequest,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Authenticate user and return tokens."""
    auth_service = AuthService(user_repo)
    
    user, profile, access_token, refresh_token = await auth_service.login(
        email=request.email,
        password=request.password
    )
    
    from app.schemas.auth import UserResponse, ProfileResponse
    
    return LoginResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            email_verified=user.email_verified,
            account_status=user.account_status
        ),
        profile=ProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            username=profile.username,
            display_name=profile.display_name,
            avatar_url=profile.avatar_url,
            region=profile.region
        ),
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=900
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token"
)
async def refresh_token(
    request: RefreshTokenRequest,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Refresh access token using refresh token."""
    auth_service = AuthService(user_repo)
    
    access_token, refresh_token = await auth_service.refresh_access_token(
        request.refresh_token
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=900
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout and invalidate refresh token"
)
async def logout(request: LogoutRequest):
    """
    Logout user.
    Note: In production, we'd invalidate the refresh token in Redis/database.
    For MVP, we'll just return success. Token invalidation can be added later.
    """
    # TODO: Implement token invalidation (store in Redis with TTL)
    return {"message": "Logged out successfully"}


@router.get(
    "/me",
    response_model=CurrentUserResponse,
    summary="Get current authenticated user"
)
async def get_me(
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Get current authenticated user."""
    profile = await user_repo.get_profile_by_user_id(current_user.id)
    
    if not profile:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Profile", str(current_user.id))
    
    from app.schemas.auth import UserResponse, ProfileResponse
    
    return CurrentUserResponse(
        user=UserResponse(
            id=current_user.id,
            email=current_user.email,
            email_verified=current_user.email_verified,
            account_status=current_user.account_status
        ),
        profile=ProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            username=profile.username,
            display_name=profile.display_name,
            avatar_url=profile.avatar_url,
            region=profile.region
        ),
        roles=["PLAYER"]  # TODO: Get actual roles from database
    )
