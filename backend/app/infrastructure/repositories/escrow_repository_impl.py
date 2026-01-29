"""
Escrow repository implementation using SQLAlchemy.
"""
from typing import Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domain.entities.payment import EscrowAccount
from app.domain.repositories.escrow_repository import EscrowRepository
from app.infrastructure.database.models.wallet import EscrowAccount as EscrowAccountModel


class EscrowRepositoryImpl(EscrowRepository):
    """SQLAlchemy implementation of EscrowRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_domain_escrow(self, model: EscrowAccountModel) -> EscrowAccount:
        """Convert SQLAlchemy model to domain entity."""
        return EscrowAccount(
            id=model.id,
            match_id=model.match_id,
            total_amount_cents=model.total_amount_cents,
            player1_amount_cents=model.player1_amount_cents,
            player2_amount_cents=model.player2_amount_cents,
            platform_fee_cents=model.platform_fee_cents,
            status=model.status,
            locked_at=model.locked_at,
            released_at=model.released_at,
            released_to=model.released_to,
            held_at=model.held_at,
            refunded_at=model.refunded_at,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    async def create_escrow(
        self,
        match_id: UUID,
        player1_amount_cents: int,
        player2_amount_cents: int,
        platform_fee_cents: int
    ) -> EscrowAccount:
        """Create escrow account for match."""
        total_amount = player1_amount_cents + player2_amount_cents - platform_fee_cents
        
        escrow_model = EscrowAccountModel(
            match_id=match_id,
            total_amount_cents=total_amount,
            player1_amount_cents=player1_amount_cents,
            player2_amount_cents=player2_amount_cents,
            platform_fee_cents=platform_fee_cents,
            status="LOCKED"
        )
        
        self.session.add(escrow_model)
        await self.session.commit()
        await self.session.refresh(escrow_model)
        
        return self._to_domain_escrow(escrow_model)
    
    async def get_escrow_by_match_id(self, match_id: UUID) -> Optional[EscrowAccount]:
        """Get escrow account by match ID."""
        result = await self.session.execute(
            select(EscrowAccountModel).where(EscrowAccountModel.match_id == match_id)
        )
        model = result.scalar_one_or_none()
        return self._to_domain_escrow(model) if model else None
    
    async def update_escrow(self, escrow: EscrowAccount) -> EscrowAccount:
        """Update escrow account."""
        result = await self.session.execute(
            select(EscrowAccountModel).where(EscrowAccountModel.id == escrow.id)
        )
        model = result.scalar_one()
        
        model.status = escrow.status
        model.released_at = escrow.released_at
        model.released_to = escrow.released_to
        model.held_at = escrow.held_at
        model.refunded_at = escrow.refunded_at
        
        await self.session.commit()
        await self.session.refresh(model)
        
        return self._to_domain_escrow(model)
