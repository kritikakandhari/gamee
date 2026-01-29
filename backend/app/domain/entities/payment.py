"""
Payment domain entities.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from uuid import UUID
from enum import Enum


class TransactionType(str, Enum):
    """Transaction type enum."""
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    MATCH_ENTRY = "MATCH_ENTRY"
    MATCH_WIN = "MATCH_WIN"
    MATCH_REFUND = "MATCH_REFUND"
    ESCROW_LOCK = "ESCROW_LOCK"
    ESCROW_RELEASE = "ESCROW_RELEASE"
    DISPUTE_HOLD = "DISPUTE_HOLD"
    DISPUTE_PAYOUT = "DISPUTE_PAYOUT"
    DISPUTE_REFUND = "DISPUTE_REFUND"
    PLATFORM_FEE = "PLATFORM_FEE"
    ADJUSTMENT = "ADJUSTMENT"


class TransactionStatus(str, Enum):
    """Transaction status enum."""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REVERSED = "REVERSED"


@dataclass
class Wallet:
    """Wallet domain entity."""
    id: UUID
    user_id: UUID
    balance_cents: int
    pending_cents: int
    total_deposited_cents: int
    total_withdrawn_cents: int
    currency: str
    created_at: datetime
    updated_at: datetime
    
    def has_sufficient_balance(self, amount_cents: int) -> bool:
        """Check if wallet has sufficient balance."""
        return self.balance_cents >= amount_cents


@dataclass
class Transaction:
    """Transaction domain entity."""
    id: UUID
    user_id: UUID
    wallet_id: UUID
    transaction_type: TransactionType
    status: TransactionStatus
    amount_cents: int
    balance_before_cents: int
    balance_after_cents: int
    reference_id: Optional[UUID]
    reference_type: Optional[str]
    external_id: Optional[str]
    idempotency_key: Optional[str]
    description: Optional[str]
    processed_at: Optional[datetime]
    created_at: datetime


@dataclass
class EscrowAccount:
    """Escrow account domain entity."""
    id: UUID
    match_id: UUID
    total_amount_cents: int
    player1_amount_cents: int
    player2_amount_cents: int
    platform_fee_cents: int
    status: str  # LOCKED, RELEASED, HELD, REFUNDED
    locked_at: datetime
    released_at: Optional[datetime]
    released_to: Optional[UUID]
    held_at: Optional[datetime]
    refunded_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    def can_be_released(self) -> bool:
        """Check if escrow can be released."""
        return self.status == "LOCKED"
    
    def can_be_refunded(self) -> bool:
        """Check if escrow can be refunded."""
        return self.status in ("LOCKED", "HELD")
