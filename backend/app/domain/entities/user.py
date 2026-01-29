"""
User domain entity.
Represents the core user business logic, independent of infrastructure.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
from uuid import UUID


@dataclass
class User:
    """User domain entity."""
    id: UUID
    email: str
    email_verified: bool
    account_status: str  # ACTIVE, SUSPENDED, BANNED
    failed_login_attempts: int
    locked_until: Optional[datetime]
    last_login_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    def is_active(self) -> bool:
        """Check if user account is active."""
        return self.account_status == "ACTIVE"
    
    def has_role(self, role_name: str) -> bool:
        """Check if user has a specific role."""
        # This would check the roles relationship
        # For MVP, we'll check if user is admin based on email or a flag
        # In production, this would query the roles table
        return role_name.upper() in [r.upper() for r in (self.roles or [])] and self.deleted_at is None
    
    def is_locked(self) -> bool:
        """Check if user account is locked."""
        if self.locked_until is None:
            return False
        return datetime.utcnow() < self.locked_until
    
    def can_login(self) -> bool:
        """Check if user can attempt login."""
        return self.is_active() and not self.is_locked()


@dataclass
class PlayerProfile:
    """Player profile domain entity."""
    id: UUID
    user_id: UUID
    username: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    region: str
    timezone: Optional[str]
    bio: Optional[str]
    created_at: datetime
    updated_at: datetime
