"""
Dispute service.
Handles dispute creation, evidence management, and resolution.
"""
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.domain.entities.dispute import Dispute, DisputeStatus, DisputeResolution
from app.domain.repositories.dispute_repository import DisputeRepository
from app.domain.repositories.match_repository import MatchRepository
from app.domain.repositories.escrow_repository import EscrowRepository
from app.domain.services.escrow_service import EscrowService
from app.core.exceptions import (
    BusinessLogicError,
    NotFoundError,
    ValidationError,
    ConflictError
)


class DisputeService:
    """Dispute service."""
    
    def __init__(
        self,
        dispute_repository: DisputeRepository,
        match_repository: MatchRepository,
        escrow_service: Optional[EscrowService] = None
    ):
        self.dispute_repository = dispute_repository
        self.match_repository = match_repository
        self.escrow_service = escrow_service
    
    async def create_dispute(
        self,
        match_id: UUID,
        created_by: UUID,
        reason: str,
        description: str
    ) -> Dispute:
        """
        Create a dispute for a match.
        
        Validates:
        - Match exists
        - User is a participant
        - Match is in a disputable state
        - No existing dispute for this match
        """
        # Verify match exists
        match = await self.match_repository.get_match_by_id(match_id)
        if not match:
            raise NotFoundError("Match", str(match_id))
        
        # Verify user is a participant
        if not match.is_participant(created_by):
            raise BusinessLogicError(
                "Only match participants can create disputes",
                code="NOT_PARTICIPANT"
            )
        
        # Verify match is in disputable state
        if match.status not in ("IN_PROGRESS", "COMPLETED"):
            raise BusinessLogicError(
                f"Cannot dispute match in status: {match.status}",
                code="INVALID_MATCH_STATE"
            )
        
        # Check for existing dispute
        existing = await self.dispute_repository.get_dispute_by_match_id(match_id)
        if existing:
            raise ConflictError("Dispute already exists for this match", code="DUPLICATE_DISPUTE")
        
        # Create dispute
        dispute = await self.dispute_repository.create_dispute(
            match_id=match_id,
            created_by=created_by,
            reason=reason,
            description=description
        )
        
        # Update match status to DISPUTED
        match.status = "DISPUTED"
        await self.match_repository.update_match(match)
        
        # Hold escrow if available
        if self.escrow_service:
            await self.escrow_service.hold_for_dispute(match_id)
        
        return dispute
    
    async def resolve_dispute(
        self,
        dispute_id: UUID,
        resolved_by: UUID,
        resolution: DisputeResolution,
        resolution_notes: Optional[str] = None
    ) -> Dispute:
        """
        Resolve a dispute (admin only).
        
        Handles escrow payout based on resolution.
        """
        dispute = await self.dispute_repository.get_dispute_by_id(dispute_id)
        if not dispute:
            raise NotFoundError("Dispute", str(dispute_id))
        
        if not dispute.can_be_resolved():
            raise BusinessLogicError(
                f"Dispute cannot be resolved. Current status: {dispute.status}",
                code="INVALID_DISPUTE_STATE"
            )
        
        # Get match for participants
        match = await self.match_repository.get_match_by_id(dispute.match_id)
        if not match:
            raise NotFoundError("Match", str(dispute.match_id))
        
        participants = await self.match_repository.get_participants(dispute.match_id)
        if len(participants) != 2:
            raise BusinessLogicError("Match must have 2 participants", code="INVALID_MATCH")
        
        player1_id = participants[0].user_id
        player2_id = participants[1].user_id
        
        # Handle escrow based on resolution
        if self.escrow_service:
            escrow = await self.escrow_service.escrow_repository.get_escrow_by_match_id(dispute.match_id)
            
            if escrow and escrow.status == "HELD":
                if resolution == DisputeResolution.PLAYER1_WINS:
                    await self.escrow_service.release_to_winner(dispute.match_id, player1_id)
                elif resolution == DisputeResolution.PLAYER2_WINS:
                    await self.escrow_service.release_to_winner(dispute.match_id, player2_id)
                elif resolution == DisputeResolution.SPLIT:
                    # Split 50/50
                    # This would require a new method in escrow service
                    # For MVP, we'll refund both
                    await self.escrow_service.refund_match(dispute.match_id, player1_id, player2_id)
                elif resolution == DisputeResolution.REFUND_BOTH:
                    await self.escrow_service.refund_match(dispute.match_id, player1_id, player2_id)
        
        # Update dispute
        dispute.status = DisputeStatus.RESOLVED
        dispute.resolution = resolution
        dispute.resolved_by = resolved_by
        dispute.resolved_at = datetime.utcnow()
        dispute.resolution_notes = resolution_notes
        
        updated_dispute = await self.dispute_repository.update_dispute(dispute)
        
        return updated_dispute
