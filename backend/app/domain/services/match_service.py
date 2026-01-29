"""
Match service.
Handles match creation, acceptance, completion, and cancellation.
"""
from typing import Optional, List, Tuple
from datetime import datetime
from uuid import UUID

from app.domain.entities.match import Match, MatchResult
from app.domain.repositories.match_repository import MatchRepository
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.ranking_repository import RankingRepository
from app.domain.repositories.escrow_repository import EscrowRepository
from app.domain.services.ranking_service import RankingService
from app.domain.services.escrow_service import EscrowService
from app.core.exceptions import (
    BusinessLogicError,
    NotFoundError,
    ValidationError,
    ConflictError
)


class MatchService:
    """Match service."""
    
    def __init__(
        self,
        match_repository: MatchRepository,
        user_repository: UserRepository,
        ranking_repository: Optional[RankingRepository] = None,
        escrow_service: Optional[EscrowService] = None
    ):
        self.match_repository = match_repository
        self.user_repository = user_repository
        self.ranking_repository = ranking_repository
        self.escrow_service = escrow_service
    
    async def create_match(
        self,
        match_type: str,
        stake_cents: int,
        created_by: UUID,
        game_type: Optional[str] = None,
        best_of: int = 3
    ) -> Match:
        """
        Create a new match.
        
        Validates:
        - Match type is valid
        - Stake is within limits (min $1, max $1000)
        - Best of is odd number
        - User exists and is active
        """
        # Validate match type
        if match_type not in ("QUICK_DUEL", "RANKED", "DIRECT_CHALLENGE"):
            raise ValidationError("Invalid match type", field="match_type")
        
        # Validate stake
        if stake_cents < 100:  # $1.00 minimum
            raise ValidationError("Stake must be at least $1.00", field="stake_cents")
        if stake_cents > 100000:  # $1000.00 maximum
            raise ValidationError("Stake cannot exceed $1000.00", field="stake_cents")
        
        # Validate best_of
        if best_of < 1 or best_of > 7:
            raise ValidationError("Best of must be between 1 and 7", field="best_of")
        if best_of % 2 == 0:
            raise ValidationError("Best of must be an odd number", field="best_of")
        
        # Verify user exists and is active
        user = await self.user_repository.get_user_by_id(created_by)
        if not user:
            raise NotFoundError("User", str(created_by))
        if not user.is_active():
            raise BusinessLogicError("User account is not active", code="USER_INACTIVE")
        
        # Create match
        match = await self.match_repository.create_match(
            match_type=match_type,
            stake_cents=stake_cents,
            created_by=created_by,
            game_type=game_type,
            best_of=best_of
        )
        
        return match
    
    async def accept_match(self, match_id: UUID, user_id: UUID) -> Match:
        """
        Accept a match (join as opponent).
        
        Validates:
        - Match exists and is in CREATED status
        - User is not the creator
        - User exists and is active
        """
        match = await self.match_repository.get_match_by_id(match_id)
        if not match:
            raise NotFoundError("Match", str(match_id))
        
        if not match.can_be_accepted():
            raise BusinessLogicError(
                f"Match cannot be accepted. Current status: {match.status}",
                code="INVALID_MATCH_STATE"
            )
        
        if match.created_by == user_id:
            raise BusinessLogicError("Cannot accept your own match", code="CANNOT_ACCEPT_OWN_MATCH")
        
        # Verify user exists and is active
        user = await self.user_repository.get_user_by_id(user_id)
        if not user:
            raise NotFoundError("User", str(user_id))
        if not user.is_active():
            raise BusinessLogicError("User account is not active", code="USER_INACTIVE")
        
        # Update match
        match.accepted_by = user_id
        match.status = "ACCEPTED"
        
        # Add participant
        await self.match_repository.add_participant(match_id, user_id, team_number=2)
        
        # Lock funds in escrow if escrow service is available
        if self.escrow_service:
            participants = await self.match_repository.get_participants(match_id)
            if len(participants) == 2:
                player1_id = participants[0].user_id
                player2_id = participants[1].user_id
                await self.escrow_service.lock_funds_for_match(
                    match_id=match_id,
                    player1_id=player1_id,
                    player2_id=player2_id,
                    stake_cents=match.stake_cents,
                    platform_fee_cents=match.platform_fee_cents
                )
        
        updated_match = await self.match_repository.update_match(match)
        
        return updated_match
    
    async def start_match(self, match_id: UUID, user_id: UUID) -> Match:
        """
        Start a match (both players ready).
        
        Validates:
        - Match exists and is in ACCEPTED status
        - User is a participant
        """
        match = await self.match_repository.get_match_by_id(match_id)
        if not match:
            raise NotFoundError("Match", str(match_id))
        
        if not match.can_be_started():
            raise BusinessLogicError(
                f"Match cannot be started. Current status: {match.status}",
                code="INVALID_MATCH_STATE"
            )
        
        if not match.is_participant(user_id):
            raise BusinessLogicError("User is not a participant", code="NOT_PARTICIPANT")
        
        # Update match
        match.status = "IN_PROGRESS"
        match.started_at = datetime.utcnow()
        
        updated_match = await self.match_repository.update_match(match)
        
        return updated_match
    
    async def complete_match(
        self,
        match_id: UUID,
        winner_id: UUID,
        game_results: List[dict],
        reported_by: UUID
    ) -> Tuple[Match, List[MatchResult]]:
        """
        Complete a match with results.
        
        Validates:
        - Match exists and is in IN_PROGRESS status
        - Reported by is a participant
        - Winner is a participant
        - Game results match best_of count
        - Winner won majority of games
        """
        match = await self.match_repository.get_match_by_id(match_id)
        if not match:
            raise NotFoundError("Match", str(match_id))
        
        if not match.can_be_completed():
            raise BusinessLogicError(
                f"Match cannot be completed. Current status: {match.status}",
                code="INVALID_MATCH_STATE"
            )
        
        if not match.is_participant(reported_by):
            raise BusinessLogicError("User is not a participant", code="NOT_PARTICIPANT")
        
        if not match.is_participant(winner_id):
            raise BusinessLogicError("Winner must be a participant", code="INVALID_WINNER")
        
        # Validate game results
        if len(game_results) != match.best_of:
            raise ValidationError(
                f"Must provide {match.best_of} game results",
                field="game_results"
            )
        
        # Create match results
        results = []
        winner_wins = 0
        
        for i, game_result in enumerate(game_results, start=1):
            game_winner_id = UUID(game_result["winner_id"])
            
            if not match.is_participant(game_winner_id):
                raise ValidationError(
                    f"Game {i} winner must be a participant",
                    field="game_results"
                )
            
            result = await self.match_repository.create_match_result(
                match_id=match_id,
                game_number=i,
                winner_id=game_winner_id,
                reported_by=reported_by
            )
            results.append(result)
            
            if game_winner_id == winner_id:
                winner_wins += 1
        
        # Verify winner won majority
        required_wins = (match.best_of // 2) + 1
        if winner_wins < required_wins:
            raise ValidationError(
                f"Winner must win at least {required_wins} games",
                field="game_results"
            )
        
        # Update match
        match.winner_id = winner_id
        match.status = "COMPLETED"
        match.completed_at = datetime.utcnow()
        
        updated_match = await self.match_repository.update_match(match)
        
        # Get participants for ranking and escrow
        participants = await self.match_repository.get_participants(match_id)
        
        # Update rankings if ranking repository is available
        if self.ranking_repository and len(participants) == 2:
            ranking_service = RankingService(self.ranking_repository, self.user_repository)
            player1_id = participants[0].user_id
            player2_id = participants[1].user_id
            await ranking_service.update_rankings_after_match(
                player1_id,
                player2_id,
                winner_id
            )
        
        # Release escrow to winner if escrow service is available
        if self.escrow_service:
            await self.escrow_service.release_to_winner(match_id, winner_id)
        
        return updated_match, results
    
    async def cancel_match(
        self,
        match_id: UUID,
        user_id: UUID,
        reason: Optional[str] = None
    ) -> Match:
        """
        Cancel a match.
        
        Validates:
        - Match exists and can be cancelled
        - User is creator or participant
        """
        match = await self.match_repository.get_match_by_id(match_id)
        if not match:
            raise NotFoundError("Match", str(match_id))
        
        if not match.can_be_cancelled():
            raise BusinessLogicError(
                f"Match cannot be cancelled. Current status: {match.status}",
                code="INVALID_MATCH_STATE"
            )
        
        # Only creator can cancel, or participant if match is ACCEPTED
        if match.created_by != user_id:
            if match.status != "ACCEPTED" or not match.is_participant(user_id):
                raise BusinessLogicError(
                    "Only match creator can cancel",
                    code="NOT_AUTHORIZED"
                )
        
        # Get participants for refund
        participants = await self.match_repository.get_participants(match_id)
        
        # Refund escrow if escrow service is available
        if self.escrow_service and len(participants) == 2:
            player1_id = participants[0].user_id
            player2_id = participants[1].user_id
            await self.escrow_service.refund_match(match_id, player1_id, player2_id)
        
        # Update match
        match.status = "CANCELLED"
        match.cancelled_at = datetime.utcnow()
        match.cancelled_by = user_id
        match.cancellation_reason = reason
        
        updated_match = await self.match_repository.update_match(match)
        
        return updated_match
