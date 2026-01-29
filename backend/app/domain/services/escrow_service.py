"""
Escrow service.
Handles escrow account management, fund locking, release, and refunds.
"""
from typing import Tuple
from uuid import UUID
from datetime import datetime

from app.domain.entities.payment import EscrowAccount, TransactionType
from app.domain.repositories.escrow_repository import EscrowRepository
from app.domain.repositories.wallet_repository import WalletRepository
from app.domain.services.wallet_service import WalletService
from app.core.exceptions import (
    BusinessLogicError,
    NotFoundError,
    ValidationError
)


class EscrowService:
    """Escrow service."""
    
    def __init__(
        self,
        escrow_repository: EscrowRepository,
        wallet_service: WalletService
    ):
        self.escrow_repository = escrow_repository
        self.wallet_service = wallet_service
    
    async def lock_funds_for_match(
        self,
        match_id: UUID,
        player1_id: UUID,
        player2_id: UUID,
        stake_cents: int,
        platform_fee_cents: int
    ) -> EscrowAccount:
        """
        Lock funds from both players in escrow.
        
        This debits both players' wallets and creates escrow account.
        """
        # Debit player 1
        idempotency_key_1 = f"escrow_lock_{match_id}_player1"
        await self.wallet_service.debit_wallet(
            user_id=player1_id,
            amount_cents=stake_cents,
            transaction_type=TransactionType.ESCROW_LOCK,
            idempotency_key=idempotency_key_1,
            reference_id=match_id,
            reference_type="match",
            description=f"Escrow lock for match {match_id}"
        )
        
        # Debit player 2
        idempotency_key_2 = f"escrow_lock_{match_id}_player2"
        await self.wallet_service.debit_wallet(
            user_id=player2_id,
            amount_cents=stake_cents,
            transaction_type=TransactionType.ESCROW_LOCK,
            idempotency_key=idempotency_key_2,
            reference_id=match_id,
            reference_type="match",
            description=f"Escrow lock for match {match_id}"
        )
        
        # Create escrow account
        escrow = await self.escrow_repository.create_escrow(
            match_id=match_id,
            player1_amount_cents=stake_cents,
            player2_amount_cents=stake_cents,
            platform_fee_cents=platform_fee_cents
        )
        
        return escrow
    
    async def release_to_winner(
        self,
        match_id: UUID,
        winner_id: UUID
    ) -> Tuple[EscrowAccount, list]:
        """
        Release escrow funds to winner.
        
        Returns:
            Tuple of (updated_escrow, transactions)
        """
        escrow = await self.escrow_repository.get_escrow_by_match_id(match_id)
        if not escrow:
            raise NotFoundError("Escrow", str(match_id))
        
        if not escrow.can_be_released():
            raise BusinessLogicError(
                f"Escrow cannot be released. Current status: {escrow.status}",
                code="INVALID_ESCROW_STATE"
            )
        
        # Get participants to determine who is player1/player2
        # For now, we'll use the escrow amounts to determine
        # In production, we'd query match participants
        
        # Release total pot to winner
        idempotency_key = f"escrow_release_{match_id}_{winner_id}"
        transaction = await self.wallet_service.credit_wallet(
            user_id=winner_id,
            amount_cents=escrow.total_amount_cents,
            transaction_type=TransactionType.ESCROW_RELEASE,
            idempotency_key=idempotency_key,
            reference_id=match_id,
            reference_type="match",
            description=f"Match win payout: ${escrow.total_amount_cents / 100:.2f}"
        )
        
        # Update escrow
        escrow.status = "RELEASED"
        escrow.released_at = datetime.utcnow()
        escrow.released_to = winner_id
        
        updated_escrow = await self.escrow_repository.update_escrow(escrow)
        
        return updated_escrow, [transaction]
    
    async def refund_match(
        self,
        match_id: UUID,
        player1_id: UUID,
        player2_id: UUID
    ) -> Tuple[EscrowAccount, list]:
        """
        Refund escrow funds to both players (match cancelled).
        
        Returns:
            Tuple of (updated_escrow, transactions)
        """
        escrow = await self.escrow_repository.get_escrow_by_match_id(match_id)
        if not escrow:
            raise NotFoundError("Escrow", str(match_id))
        
        if not escrow.can_be_refunded():
            raise BusinessLogicError(
                f"Escrow cannot be refunded. Current status: {escrow.status}",
                code="INVALID_ESCROW_STATE"
            )
        
        transactions = []
        
        # Refund player 1
        idempotency_key_1 = f"escrow_refund_{match_id}_player1"
        txn1 = await self.wallet_service.credit_wallet(
            user_id=player1_id,
            amount_cents=escrow.player1_amount_cents,
            transaction_type=TransactionType.MATCH_REFUND,
            idempotency_key=idempotency_key_1,
            reference_id=match_id,
            reference_type="match",
            description=f"Match cancellation refund: ${escrow.player1_amount_cents / 100:.2f}"
        )
        transactions.append(txn1)
        
        # Refund player 2
        idempotency_key_2 = f"escrow_refund_{match_id}_player2"
        txn2 = await self.wallet_service.credit_wallet(
            user_id=player2_id,
            amount_cents=escrow.player2_amount_cents,
            transaction_type=TransactionType.MATCH_REFUND,
            idempotency_key=idempotency_key_2,
            reference_id=match_id,
            reference_type="match",
            description=f"Match cancellation refund: ${escrow.player2_amount_cents / 100:.2f}"
        )
        transactions.append(txn2)
        
        # Update escrow
        escrow.status = "REFUNDED"
        escrow.refunded_at = datetime.utcnow()
        
        updated_escrow = await self.escrow_repository.update_escrow(escrow)
        
        return updated_escrow, transactions
    
    async def hold_for_dispute(
        self,
        match_id: UUID
    ) -> EscrowAccount:
        """
        Hold escrow funds due to dispute.
        """
        escrow = await self.escrow_repository.get_escrow_by_match_id(match_id)
        if not escrow:
            raise NotFoundError("Escrow", str(match_id))
        
        if escrow.status != "LOCKED":
            raise BusinessLogicError(
                f"Can only hold locked escrow. Current status: {escrow.status}",
                code="INVALID_ESCROW_STATE"
            )
        
        escrow.status = "HELD"
        escrow.held_at = datetime.utcnow()
        
        updated_escrow = await self.escrow_repository.update_escrow(escrow)
        
        return updated_escrow
