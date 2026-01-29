"""
Ranking repository implementation using SQLAlchemy.
"""
from typing import Optional, List, Tuple
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from sqlalchemy.orm import selectinload

from app.domain.repositories.ranking_repository import RankingRepository
from app.infrastructure.database.models.ranking import Ranking as RankingModel
from app.infrastructure.database.models.player_profile import PlayerProfile as PlayerProfileModel


class RankingRepositoryImpl(RankingRepository):
    """SQLAlchemy implementation of RankingRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_ranking_by_user_id(self, user_id: UUID) -> Optional[dict]:
        """Get ranking for a user."""
        result = await self.session.execute(
            select(RankingModel).where(RankingModel.user_id == user_id)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            return None
        
        # Calculate win rate
        total = model.wins + model.losses + model.draws
        win_rate = (model.wins / total * 100) if total > 0 else 0.0
        
        return {
            "user_id": str(model.user_id),
            "rating": model.rating,
            "peak_rating": model.peak_rating,
            "wins": model.wins,
            "losses": model.losses,
            "draws": model.draws,
            "win_streak": model.win_streak,
            "best_win_streak": model.best_win_streak,
            "total_matches": model.total_matches,
            "win_rate": round(win_rate, 2),
            "total_earnings_cents": model.total_earnings_cents,
            "last_match_at": model.last_match_at.isoformat() if model.last_match_at else None
        }
    
    async def update_ranking_after_match(
        self,
        user_id: UUID,
        won: bool,
        rating_change: int,
        new_rating: int
    ) -> dict:
        """Update user ranking after match."""
        result = await self.session.execute(
            select(RankingModel).where(RankingModel.user_id == user_id)
        )
        model = result.scalar_one()
        
        # Update rating
        old_rating = model.rating
        model.rating = new_rating
        
        # Update peak rating if new rating is higher
        if new_rating > model.peak_rating:
            model.peak_rating = new_rating
        
        # Update win/loss counts
        if won:
            model.wins += 1
            model.win_streak += 1
            if model.win_streak > model.best_win_streak:
                model.best_win_streak = model.win_streak
        else:
            model.losses += 1
            model.win_streak = 0
        
        model.total_matches += 1
        model.last_match_at = datetime.utcnow()
        
        await self.session.commit()
        await self.session.refresh(model)
        
        # Calculate win rate
        total = model.wins + model.losses + model.draws
        win_rate = (model.wins / total * 100) if total > 0 else 0.0
        
        return {
            "user_id": str(model.user_id),
            "rating": model.rating,
            "rating_change": rating_change,
            "wins": model.wins,
            "losses": model.losses,
            "win_streak": model.win_streak,
            "total_matches": model.total_matches,
            "win_rate": round(win_rate, 2)
        }
    
    async def get_leaderboard(
        self,
        limit: int = 100,
        cursor: Optional[str] = None
    ) -> Tuple[List[dict], Optional[str]]:
        """Get leaderboard."""
        # Query rankings with user profile info
        query = (
            select(
                RankingModel,
                PlayerProfileModel.username,
                PlayerProfileModel.display_name
            )
            .join(PlayerProfileModel, RankingModel.user_id == PlayerProfileModel.user_id)
            .order_by(desc(RankingModel.rating))
            .limit(limit + 1)
        )
        
        # Cursor-based pagination (using rating as cursor)
        if cursor:
            try:
                cursor_rating = int(cursor)
                query = query.where(RankingModel.rating < cursor_rating)
            except ValueError:
                pass
        
        result = await self.session.execute(query)
        rows = result.all()
        
        leaderboard = []
        for i, (ranking, username, display_name) in enumerate(rows[:limit]):
            total = ranking.wins + ranking.losses + ranking.draws
            win_rate = (ranking.wins / total * 100) if total > 0 else 0.0
            
            leaderboard.append({
                "rank": i + 1,
                "user_id": str(ranking.user_id),
                "username": username,
                "display_name": display_name,
                "rating": ranking.rating,
                "wins": ranking.wins,
                "losses": ranking.losses,
                "draws": ranking.draws,
                "win_streak": ranking.win_streak,
                "total_matches": ranking.total_matches,
                "win_rate": round(win_rate, 2)
            })
        
        next_cursor = None
        if len(rows) > limit:
            next_cursor = str(rows[limit][0].rating)
        
        return leaderboard, next_cursor
