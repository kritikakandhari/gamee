"""
Authentication service.
Handles user registration, login, and token management.
"""
from typing import Optional, Tuple
from datetime import datetime, timedelta
from uuid import UUID

from app.domain.entities.user import User, PlayerProfile
from app.domain.repositories.user_repository import UserRepository
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token
)
from app.core.config import settings
from app.core.exceptions import (
    AuthenticationError,
    ValidationError,
    ConflictError,
    BusinessLogicError
)


class AuthService:
    """Authentication service."""
    
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository
    
    async def register(
        self,
        email: str,
        password: str,
        username: str,
        display_name: Optional[str] = None
    ) -> Tuple[User, PlayerProfile, str, str]:
        """
        Register a new user.
        
        Returns:
            Tuple of (user, profile, access_token, refresh_token)
        """
        # Validate inputs
        if not email or "@" not in email:
            raise ValidationError("Invalid email format", field="email")
        
        if not password or len(password) < 8:
            raise ValidationError(
                "Password must be at least 8 characters",
                field="password"
            )
        
        if not username or len(username) < 3:
            raise ValidationError(
                "Username must be at least 3 characters",
                field="username"
            )
        
        # Check if email exists
        if await self.user_repository.email_exists(email):
            raise ConflictError("Email already registered", code="DUPLICATE_EMAIL")
        
        # Check if username exists
        if await self.user_repository.username_exists(username):
            raise ConflictError("Username already taken", code="DUPLICATE_USERNAME")
        
        # Hash password
        password_hash = hash_password(password)
        
        # Create user and profile
        user, profile = await self.user_repository.create_user(
            email=email,
            password_hash=password_hash,
            username=username,
            display_name=display_name
        )
        
        # Generate tokens
        access_token = create_access_token({
            "sub": str(user.id),
            "email": user.email,
            "roles": ["PLAYER"]  # Default role
        })
        
        refresh_token = create_refresh_token({
            "sub": str(user.id)
        })
        
        return user, profile, access_token, refresh_token
    
    async def login(self, email: str, password: str) -> Tuple[User, PlayerProfile, str, str]:
        """
        Authenticate user and return tokens.
        
        Returns:
            Tuple of (user, profile, access_token, refresh_token)
        """
        # Get user by email
        user = await self.user_repository.get_user_by_email(email)
        
        if not user:
            raise AuthenticationError("Invalid email or password")
        
        # Check if account is locked
        if user.is_locked():
            raise BusinessLogicError(
                "Account is locked. Please try again later.",
                code="ACCOUNT_LOCKED"
            )
        
        # Check if account is active
        if not user.is_active():
            raise AuthenticationError("Account is not active")
        
        # Get user model to access password_hash
        # Note: In production, we'd need to get the model or store hash in domain
        # For now, we'll need to modify repository to return password_hash
        # This is a design decision - we can either:
        # 1. Include password_hash in domain entity (less secure)
        # 2. Add a method to verify password in repository (better)
        # Let's go with option 2
        
        # Verify password
        password_valid = await self.user_repository.verify_password(user.id, password)
        
        if not password_valid:
            # Increment failed login attempts
            user.failed_login_attempts += 1
            
            # Lock account after 5 failed attempts
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.utcnow() + timedelta(minutes=30)
            
            await self.user_repository.update_user(user)
            raise AuthenticationError("Invalid email or password")
        
        # Reset failed attempts on successful login
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login_at = datetime.utcnow()
        await self.user_repository.update_user(user)
        
        # Get profile
        profile = await self.user_repository.get_profile_by_user_id(user.id)
        if not profile:
            raise BusinessLogicError("User profile not found", code="PROFILE_NOT_FOUND")
        
        # Generate tokens
        access_token = create_access_token({
            "sub": str(user.id),
            "email": user.email,
            "roles": ["PLAYER"]  # TODO: Get actual roles
        })
        
        refresh_token = create_refresh_token({
            "sub": str(user.id)
        })
        
        return user, profile, access_token, refresh_token
    
    async def refresh_access_token(self, refresh_token: str) -> Tuple[str, str]:
        """
        Refresh access token using refresh token.
        Returns new access_token and new refresh_token (rotated).
        """
        try:
            payload = verify_token(refresh_token, token_type="refresh")
            user_id = UUID(payload["sub"])
            
            # Get user to verify it still exists and is active
            user = await self.user_repository.get_user_by_id(user_id)
            if not user or not user.is_active():
                raise AuthenticationError("Invalid refresh token")
            
            # Generate new tokens (rotate refresh token)
            access_token = create_access_token({
                "sub": str(user.id),
                "email": user.email,
                "roles": ["PLAYER"]  # TODO: Get actual roles
            })
            
            new_refresh_token = create_refresh_token({
                "sub": str(user.id)
            })
            
            return access_token, new_refresh_token
            
        except Exception as e:
            raise AuthenticationError(f"Invalid refresh token: {str(e)}")
