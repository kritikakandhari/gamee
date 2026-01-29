"""
Ranking endpoints.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.domain.repositories.ranking_repository import RankingRepository
from app.infrastructure.repositories.ranking_repository_impl import RankingRepositoryImpl
from app.infrastructure.database.session import get_db
from app.api.deps import get_current_user
from app.domain.entities.user import User
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


def get_ranking_repository(
    db: AsyncSession = Depends(get_db)
) -> RankingRepository:
    """Dependency for ranking repository."""
    return RankingRepositoryImpl(db)


@router.get("", summary="Get leaderboard")
async def get_leaderboard(
    limit: int = Query(100, ge=1, le=1000),
    cursor: Optional[str] = Query(None),
    ranking_repo: RankingRepository = Depends(get_ranking_repository)
):
    """Get leaderboard."""
    leaderboard, next_cursor = await ranking_repo.get_leaderboard(
        limit=limit,
        cursor=cursor
    )
    
    return {
        "data": leaderboard,
        "meta": {
            "pagination": {
                "cursor": next_cursor,
                "has_more": next_cursor is not None
            }
        }
    }


@router.get("/me", summary="Get current user's ranking")
async def get_my_ranking(
    current_user: User = Depends(get_current_user),
    ranking_repo: RankingRepository = Depends(get_ranking_repository)
):
    """Get current user's ranking."""
    ranking = await ranking_repo.get_ranking_by_user_id(current_user.id)
    
    if not ranking:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Ranking", str(current_user.id))
    
    return {"data": ranking}
