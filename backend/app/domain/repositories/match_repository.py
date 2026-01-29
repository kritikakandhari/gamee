"""
Match repository interface.
"""
from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID

from app.domain.entities.match import Match, MatchParticipant, MatchResult


class MatchRepository(ABC):
    """Interface for match repository operations."""
    
    @abstractmethod
    async def create_match(
        self,
        match_type: str,
        stake_cents: int,
        created_by: UUID,
        game_type: Optional[str] = None,
        best_of: int = 3
    ) -> Match:
        """Create a new match."""
        pass
    
    @abstractmethod
    async def get_match_by_id(self, match_id: UUID) -> Optional[Match]:
        """Get match by ID."""
        pass
    
    @abstractmethod
    async def update_match(self, match: Match) -> Match:
        """Update match."""
        pass
    
    @abstractmethod
    async def list_matches(
        self,
        status: Optional[str] = None,
        match_type: Optional[str] = None,
        limit: int = 20,
        cursor: Optional[str] = None
    ) -> tuple[List[Match], Optional[str]]:
        """List matches with filtering and pagination."""
        pass
    
    @abstractmethod
    async def get_user_matches(
        self,
        user_id: UUID,
        status: Optional[str] = None,
        limit: int = 20,
        cursor: Optional[str] = None
    ) -> tuple[List[Match], Optional[str]]:
        """Get matches for a specific user."""
        pass
    
    @abstractmethod
    async def add_participant(
        self,
        match_id: UUID,
        user_id: UUID,
        team_number: int
    ) -> MatchParticipant:
        """Add participant to match."""
        pass
    
    @abstractmethod
    async def get_participants(self, match_id: UUID) -> List[MatchParticipant]:
        """Get all participants for a match."""
        pass
    
    @abstractmethod
    async def create_match_result(
        self,
        match_id: UUID,
        game_number: int,
        winner_id: UUID,
        reported_by: UUID
    ) -> MatchResult:
        """Create a match result."""
        pass
    
    @abstractmethod
    async def get_match_results(self, match_id: UUID) -> List[MatchResult]:
        """Get all results for a match."""
        pass
