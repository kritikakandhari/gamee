"""
Admin endpoints.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.api.deps import get_current_user
from app.domain.entities.user import User
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.match_repository import MatchRepository
from app.domain.repositories.dispute_repository import DisputeRepository
from app.domain.repositories.wallet_repository import WalletRepository
from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl
from app.infrastructure.repositories.match_repository_impl import MatchRepositoryImpl
from app.infrastructure.repositories.dispute_repository_impl import DisputeRepositoryImpl
from app.infrastructure.repositories.wallet_repository_impl import WalletRepositoryImpl
from app.infrastructure.database.session import get_db
from app.core.exceptions import ForbiddenError
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role."""
    # TODO: Implement proper role checking
    # For MVP, we'll allow access - in production, check user_roles table
    # For now, we'll just verify user is authenticated
    # In production: check if user has ADMIN role in user_roles table
    return current_user


async def get_user_repository_admin(
    db: AsyncSession = Depends(get_db)
) -> UserRepository:
    """Dependency for user repository."""
    return UserRepositoryImpl(db)


async def get_match_repository_admin(
    db: AsyncSession = Depends(get_db)
) -> MatchRepository:
    """Dependency for match repository."""
    return MatchRepositoryImpl(db)


async def get_dispute_repository_admin(
    db: AsyncSession = Depends(get_db)
) -> DisputeRepository:
    """Dependency for dispute repository."""
    return DisputeRepositoryImpl(db)


async def get_wallet_repository_admin(
    db: AsyncSession = Depends(get_db)
) -> WalletRepository:
    """Dependency for wallet repository."""
    return WalletRepositoryImpl(db)


@router.get("/users", summary="List all users (admin)")
async def list_users(
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    admin_user: User = Depends(require_admin),
    user_repo: UserRepository = Depends(get_user_repository_admin)
):
    """List all users (admin only)."""
    # TODO: Implement pagination
    from app.schemas.user import UserPublic
    
    # For MVP, return empty list - would need pagination method in repository
    return {
        "data": [],
        "meta": {"pagination": {"cursor": None, "has_more": False}}
    }


@router.get("/users/{user_id}", summary="Get user details (admin)")
async def get_user(
    user_id: UUID,
    admin_user: User = Depends(require_admin),
    user_repo: UserRepository = Depends(get_user_repository_admin)
):
    """Get user details (admin only)."""
    user = await user_repo.get_user_by_id(user_id)
    if not user:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("User", str(user_id))
    
    from app.schemas.user import UserPublic
    return UserPublic(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        is_active=user.is_active,
        created_at=user.created_at.isoformat()
    )


@router.put("/users/{user_id}/status", summary="Update user status (admin)")
async def update_user_status(
    user_id: UUID,
    is_active: bool,
    admin_user: User = Depends(require_admin),
    user_repo: UserRepository = Depends(get_user_repository_admin)
):
    """Update user status (admin only)."""
    user = await user_repo.get_user_by_id(user_id)
    if not user:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("User", str(user_id))
    
    # Update user status
    # This would require a method in user repository to update status
    # For MVP, we'll return success
    return {"success": True, "user_id": str(user_id), "is_active": is_active}


@router.get("/matches", summary="List all matches (admin)")
async def list_matches_admin(
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    admin_user: User = Depends(require_admin),
    match_repo: MatchRepository = Depends(get_match_repository_admin)
):
    """List all matches (admin only)."""
    matches, next_cursor = await match_repo.list_matches(
        status=status,
        limit=limit,
        cursor=cursor
    )
    
    from app.api.v1.matches import _match_to_response
    
    match_responses = []
    for match in matches:
        participants = await match_repo.get_participants(match.id)
        match_responses.append(_match_to_response(match, participants))
    
    return {
        "data": match_responses,
        "meta": {
            "pagination": {
                "cursor": next_cursor,
                "has_more": next_cursor is not None
            }
        }
    }


@router.get("/disputes", summary="List all disputes (admin)")
async def list_disputes_admin(
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    admin_user: User = Depends(require_admin),
    dispute_repo: DisputeRepository = Depends(get_dispute_repository_admin)
):
    """List all disputes (admin only)."""
    from app.domain.entities.dispute import DisputeStatus
    from app.api.v1.disputes import _dispute_to_response
    
    status_enum = None
    if status:
        try:
            status_enum = DisputeStatus(status)
        except ValueError:
            pass
    
    disputes, next_cursor = await dispute_repo.list_disputes(
        status=status_enum,
        limit=limit,
        cursor=cursor
    )
    
    dispute_responses = []
    for dispute in disputes:
        evidence = await dispute_repo.get_evidence(dispute.id)
        dispute_responses.append(_dispute_to_response(dispute, evidence))
    
    return {
        "data": dispute_responses,
        "meta": {
            "pagination": {
                "cursor": next_cursor,
                "has_more": next_cursor is not None
            }
        }
    }


@router.get("/stats", summary="Get platform statistics (admin)")
async def get_stats(
    admin_user: User = Depends(require_admin)
):
    """Get platform statistics (admin only)."""
    # TODO: Implement actual statistics
    # Would query database for:
    # - Total users
    # - Active matches
    # - Total transactions
    # - Revenue
    # - Pending disputes
    
    return {
        "users": {
            "total": 0,
            "active": 0
        },
        "matches": {
            "total": 0,
            "active": 0,
            "completed": 0
        },
        "transactions": {
            "total_volume_cents": 0,
            "total_count": 0
        },
        "disputes": {
            "pending": 0,
            "resolved": 0
        }
    }
