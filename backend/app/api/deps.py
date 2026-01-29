"""
FastAPI dependencies.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.session import get_db
from app.domain.repositories.user_repository import UserRepository
from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl
from app.core.security import verify_token
from app.domain.entities.user import User
from app.core.exceptions import UnauthorizedError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_user_repository(
    db: AsyncSession = Depends(get_db)
) -> UserRepository:
    """Dependency for user repository."""
    return UserRepositoryImpl(db)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repository)
) -> User:
    """Get current authenticated user."""
    try:
        payload = verify_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise UnauthorizedError("Invalid token")
    except Exception:
        raise UnauthorizedError("Invalid token")
    
    user = await user_repo.get_user_by_id(user_id)
    if user is None:
        raise UnauthorizedError("User not found")
    
    if not user.is_active():
        raise UnauthorizedError("User account is inactive")
    
    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current user and verify admin role."""
    # For MVP, we'll check admin status differently
    # In production, this would check the roles relationship
    # For now, we'll allow if user email contains admin or check a flag
    # This is a placeholder - actual implementation would query roles
    from app.core.exceptions import ForbiddenError
    
    # TODO: Implement proper role checking
    # For MVP, we'll skip the check and let the admin endpoints handle it
    return current_user
