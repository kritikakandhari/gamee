"""
User repository implementation using SQLAlchemy.
"""
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.domain.entities.user import User, PlayerProfile
from app.domain.repositories.user_repository import UserRepository
from app.infrastructure.database.models.user import User as UserModel, Role, UserRole
from app.infrastructure.database.models.player_profile import PlayerProfile as PlayerProfileModel
from app.infrastructure.database.models.wallet import Wallet as WalletModel
from app.infrastructure.database.models.ranking import Ranking as RankingModel
from app.core.security import verify_password


class UserRepositoryImpl(UserRepository):
    """SQLAlchemy implementation of UserRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_domain_user(self, model: UserModel) -> User:
        """Convert SQLAlchemy model to domain entity."""
        return User(
            id=model.id,
            email=model.email,
            email_verified=model.email_verified,
            account_status=model.account_status,
            failed_login_attempts=model.failed_login_attempts,
            locked_until=model.locked_until,
            last_login_at=model.last_login_at,
            created_at=model.created_at,
            updated_at=model.updated_at,
            deleted_at=model.deleted_at
        )
    
    def _to_domain_profile(self, model: PlayerProfileModel) -> PlayerProfile:
        """Convert SQLAlchemy model to domain entity."""
        return PlayerProfile(
            id=model.id,
            user_id=model.user_id,
            username=model.username,
            display_name=model.display_name,
            avatar_url=model.avatar_url,
            region=model.region,
            timezone=model.timezone,
            bio=model.bio,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    async def create_user(
        self,
        email: str,
        password_hash: str,
        username: str,
        display_name: Optional[str] = None
    ) -> tuple[User, PlayerProfile]:
        """Create a new user, profile, wallet, and ranking."""
        from datetime import datetime
        import uuid
        
        # Create user
        user_model = UserModel(
            email=email,
            password_hash=password_hash,
            account_status="ACTIVE"
        )
        self.session.add(user_model)
        await self.session.flush()  # Get user.id
        
        # Create profile
        profile_model = PlayerProfileModel(
            user_id=user_model.id,
            username=username,
            display_name=display_name or username,
            region="US"
        )
        self.session.add(profile_model)
        
        # Create wallet
        wallet_model = WalletModel(
            user_id=user_model.id,
            balance_cents=0,
            pending_cents=0,
            currency="USD"
        )
        self.session.add(wallet_model)
        
        # Create ranking
        ranking_model = RankingModel(
            user_id=user_model.id,
            rating=1500,
            peak_rating=1500
        )
        self.session.add(ranking_model)
        
        # Assign PLAYER role
        role_result = await self.session.execute(
            select(Role).where(Role.name == "PLAYER")
        )
        player_role = role_result.scalar_one_or_none()
        
        if player_role:
            user_role = UserRole(
                user_id=user_model.id,
                role_id=player_role.id
            )
            self.session.add(user_role)
        
        await self.session.commit()
        await self.session.refresh(user_model)
        await self.session.refresh(profile_model)
        
        return (
            self._to_domain_user(user_model),
            self._to_domain_profile(profile_model)
        )
    
    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        result = await self.session.execute(
            select(UserModel).where(
                UserModel.id == user_id,
                UserModel.deleted_at.is_(None)
            )
        )
        model = result.scalar_one_or_none()
        return self._to_domain_user(model) if model else None
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        result = await self.session.execute(
            select(UserModel).where(
                UserModel.email == email,
                UserModel.deleted_at.is_(None)
            )
        )
        model = result.scalar_one_or_none()
        return self._to_domain_user(model) if model else None
    
    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        result = await self.session.execute(
            select(UserModel)
            .join(PlayerProfileModel)
            .where(
                PlayerProfileModel.username == username,
                UserModel.deleted_at.is_(None)
            )
        )
        model = result.scalar_one_or_none()
        return self._to_domain_user(model) if model else None
    
    async def update_user(self, user: User) -> User:
        """Update user."""
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user.id)
        )
        model = result.scalar_one()
        
        model.email_verified = user.email_verified
        model.account_status = user.account_status
        model.failed_login_attempts = user.failed_login_attempts
        model.locked_until = user.locked_until
        model.last_login_at = user.last_login_at
        
        await self.session.commit()
        await self.session.refresh(model)
        
        return self._to_domain_user(model)
    
    async def get_profile_by_user_id(self, user_id: UUID) -> Optional[PlayerProfile]:
        """Get player profile by user ID."""
        result = await self.session.execute(
            select(PlayerProfileModel).where(PlayerProfileModel.user_id == user_id)
        )
        model = result.scalar_one_or_none()
        return self._to_domain_profile(model) if model else None
    
    async def update_profile(self, profile: PlayerProfile) -> PlayerProfile:
        """Update player profile."""
        result = await self.session.execute(
            select(PlayerProfileModel).where(PlayerProfileModel.id == profile.id)
        )
        model = result.scalar_one()
        
        model.display_name = profile.display_name
        model.avatar_url = profile.avatar_url
        model.bio = profile.bio
        model.timezone = profile.timezone
        
        await self.session.commit()
        await self.session.refresh(model)
        
        return self._to_domain_profile(model)
    
    async def email_exists(self, email: str) -> bool:
        """Check if email already exists."""
        result = await self.session.execute(
            select(UserModel).where(
                UserModel.email == email,
                UserModel.deleted_at.is_(None)
            )
        )
        return result.scalar_one_or_none() is not None
    
    async def username_exists(self, username: str) -> bool:
        """Check if username already exists."""
        result = await self.session.execute(
            select(PlayerProfileModel).where(PlayerProfileModel.username == username)
        )
        return result.scalar_one_or_none() is not None
    
    async def verify_password(self, user_id: UUID, password: str) -> bool:
        """Verify user password against stored hash."""
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        user_model = result.scalar_one_or_none()
        if not user_model:
            return False
        return verify_password(password, user_model.password_hash)
