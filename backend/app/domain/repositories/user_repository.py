"""
User repository interface.
Defines the contract for user data access, independent of implementation.
"""
from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID

from app.domain.entities.user import User, PlayerProfile


class UserRepository(ABC):
    """Interface for user repository operations."""
    
    @abstractmethod
    async def create_user(
        self,
        email: str,
        password_hash: str,
        username: str,
        display_name: Optional[str] = None
    ) -> tuple[User, PlayerProfile]:
        """Create a new user and profile."""
        pass
    
    @abstractmethod
    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        pass
    
    @abstractmethod
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        pass
    
    @abstractmethod
    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        pass
    
    @abstractmethod
    async def update_user(self, user: User) -> User:
        """Update user."""
        pass
    
    @abstractmethod
    async def get_profile_by_user_id(self, user_id: UUID) -> Optional[PlayerProfile]:
        """Get player profile by user ID."""
        pass
    
    @abstractmethod
    async def update_profile(self, profile: PlayerProfile) -> PlayerProfile:
        """Update player profile."""
        pass
    
    @abstractmethod
    async def email_exists(self, email: str) -> bool:
        """Check if email already exists."""
        pass
    
    @abstractmethod
    async def username_exists(self, username: str) -> bool:
        """Check if username already exists."""
        pass
    
    @abstractmethod
    async def verify_password(self, user_id: UUID, password: str) -> bool:
        """Verify user password against stored hash."""
        pass
