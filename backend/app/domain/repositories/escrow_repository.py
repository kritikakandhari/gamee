"""
Escrow repository interface.
"""
from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app.domain.entities.payment import EscrowAccount


class EscrowRepository(ABC):
    """Interface for escrow repository operations."""
    
    @abstractmethod
    async def create_escrow(
        self,
        match_id: UUID,
        player1_amount_cents: int,
        player2_amount_cents: int,
        platform_fee_cents: int
    ) -> EscrowAccount:
        """Create escrow account for match."""
        pass
    
    @abstractmethod
    async def get_escrow_by_match_id(self, match_id: UUID) -> Optional[EscrowAccount]:
        """Get escrow account by match ID."""
        pass
    
    @abstractmethod
    async def update_escrow(self, escrow: EscrowAccount) -> EscrowAccount:
        """Update escrow account."""
        pass
