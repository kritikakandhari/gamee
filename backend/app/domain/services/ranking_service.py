"""
Ranking service.
Handles ELO rating calculations and updates.
"""
from typing import Tuple
from uuid import UUID

from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.ranking_repository import RankingRepository
from app.core.exceptions import NotFoundError, BusinessLogicError


class RankingService:
    """Ranking service for ELO calculations."""
    
    def __init__(
        self,
        ranking_repository: RankingRepository,
        user_repository: UserRepository
    ):
        self.ranking_repository = ranking_repository
        self.user_repository = user_repository
    
    def calculate_elo_rating(
        self,
        player1_rating: int,
        player2_rating: int,
        player1_won: bool,
        k_factor: int = 32
    ) -> Tuple[int, int]:
        """
        Calculate new ELO ratings after match.
        
        Args:
            player1_rating: Current rating of player 1
            player2_rating: Current rating of player 2
            player1_won: True if player 1 won, False if player 2 won
            k_factor: K-factor for rating adjustment (default 32)
        
        Returns:
            Tuple of (new_player1_rating, new_player2_rating)
        """
        # Expected scores using ELO formula
        expected1 = 1 / (1 + 10 ** ((player2_rating - player1_rating) / 400))
        expected2 = 1 - expected1
        
        # Actual scores (1.0 for win, 0.0 for loss, 0.5 for draw - not used in 1v1)
        actual1 = 1.0 if player1_won else 0.0
        actual2 = 1.0 - actual1
        
        # New ratings
        new_rating1 = player1_rating + k_factor * (actual1 - expected1)
        new_rating2 = player2_rating + k_factor * (actual2 - expected2)
        
        # Round to integers
        return (int(round(new_rating1)), int(round(new_rating2)))
    
    async def update_rankings_after_match(
        self,
        player1_id: UUID,
        player2_id: UUID,
        winner_id: UUID
    ) -> Tuple[dict, dict]:
        """
        Update player rankings after match completion.
        
        Returns:
            Tuple of (player1_updates, player2_updates) with rating changes
        """
        # Get current rankings
        ranking1 = await self.ranking_repository.get_ranking_by_user_id(player1_id)
        ranking2 = await self.ranking_repository.get_ranking_by_user_id(player2_id)
        
        if not ranking1 or not ranking2:
            raise NotFoundError("Ranking", f"User {player1_id} or {player2_id}")
        
        player1_rating = ranking1["rating"]
        player2_rating = ranking2["rating"]
        player1_won = winner_id == player1_id
        
        # Calculate new ratings
        new_rating1, new_rating2 = self.calculate_elo_rating(
            player1_rating,
            player2_rating,
            player1_won
        )
        
        rating_change1 = new_rating1 - player1_rating
        rating_change2 = new_rating2 - player2_rating
        
        # Update rankings in database
        update1 = await self.ranking_repository.update_ranking_after_match(
            player1_id,
            player1_won,
            rating_change1,
            new_rating1
        )
        
        update2 = await self.ranking_repository.update_ranking_after_match(
            player2_id,
            not player1_won,
            rating_change2,
            new_rating2
        )
        
        return (
            {
                "rating_before": player1_rating,
                "rating_after": new_rating1,
                "rating_change": rating_change1,
                **update1
            },
            {
                "rating_before": player2_rating,
                "rating_after": new_rating2,
                "rating_change": rating_change2,
                **update2
            }
        )
