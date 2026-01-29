"""
Ranking repository interface.
"""
from abc import ABC, abstractmethod
from typing import Optional, List, Tuple
from uuid import UUID


class RankingRepository(ABC):
    """Interface for ranking repository operations."""
    
    @abstractmethod
    async def get_ranking_by_user_id(self, user_id: UUID) -> Optional[dict]:
        """Get ranking for a user."""
        pass
    
    @abstractmethod
    async def update_ranking_after_match(
        self,
        user_id: UUID,
        won: bool,
        rating_change: int,
        new_rating: int
    ) -> dict:
        """Update user ranking after match."""
        pass
    
    @abstractmethod
    async def get_leaderboard(
        self,
        limit: int = 100,
        cursor: Optional[str] = None
    ) -> Tuple[List[dict], Optional[str]]:
        """Get leaderboard."""
        pass
