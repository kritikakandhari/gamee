"""
Payment and wallet models.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Integer, BigInteger, DateTime, ForeignKey,
    Text, CheckConstraint, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.infrastructure.database.base import Base


class TransactionType(str, enum.Enum):
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


class TransactionStatus(str, enum.Enum):
    """Transaction status enum."""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REVERSED = "REVERSED"


class Wallet(Base):
    """Player wallet model."""
    __tablename__ = "wallets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    balance_cents = Column(BigInteger, nullable=False, default=0)
    pending_cents = Column(BigInteger, nullable=False, default=0)
    total_deposited_cents = Column(BigInteger, nullable=False, default=0)
    total_withdrawn_cents = Column(BigInteger, nullable=False, default=0)
    currency = Column(String(3), nullable=False, default="USD")
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="wallet")
    transactions = relationship("Transaction", back_populates="wallet", lazy="selectin")
    
    __table_args__ = (
        CheckConstraint("balance_cents >= 0", name="wallets_balance_cents_check"),
        CheckConstraint("pending_cents >= 0", name="wallets_pending_cents_check"),
        CheckConstraint("currency = 'USD'", name="wallets_currency_check"),
    )


class Transaction(Base):
    """Financial transaction model (immutable audit trail)."""
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id", ondelete="RESTRICT"), nullable=False, index=True)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False, index=True)
    status = Column(SQLEnum(TransactionStatus), nullable=False, default=TransactionStatus.PENDING, index=True)
    amount_cents = Column(BigInteger, nullable=False)
    balance_before_cents = Column(BigInteger, nullable=False)
    balance_after_cents = Column(BigInteger, nullable=False)
    reference_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    reference_type = Column(String(50), nullable=True)
    external_id = Column(String(255), nullable=True)
    idempotency_key = Column(String(255), unique=True, nullable=True, index=True)
    description = Column(Text, nullable=True)
    extra_data = Column(JSONB, nullable=True)  # Renamed from 'metadata' (reserved in SQLAlchemy)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    failure_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    wallet = relationship("Wallet", back_populates="transactions")
    
    __table_args__ = (
        CheckConstraint("amount_cents != 0", name="transactions_amount_cents_check"),
    )


class EscrowAccount(Base):
    """Escrow account model."""
    __tablename__ = "escrow_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(
        UUID(as_uuid=True),
        ForeignKey("matches.id", ondelete="RESTRICT"),
        unique=True,
        nullable=False,
        index=True
    )
    total_amount_cents = Column(BigInteger, nullable=False)
    player1_amount_cents = Column(BigInteger, nullable=False)
    player2_amount_cents = Column(BigInteger, nullable=False)
    platform_fee_cents = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="LOCKED", index=True)
    locked_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    released_at = Column(DateTime(timezone=True), nullable=True)
    released_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    held_at = Column(DateTime(timezone=True), nullable=True)
    refunded_at = Column(DateTime(timezone=True), nullable=True)
    extra_data = Column(JSONB, nullable=True)  # Renamed from 'metadata' (reserved in SQLAlchemy)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    match = relationship("Match", back_populates="escrow")
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('LOCKED', 'RELEASED', 'HELD', 'REFUNDED')",
            name="escrow_accounts_status_check"
        ),
        CheckConstraint(
            "total_amount_cents = player1_amount_cents + player2_amount_cents - platform_fee_cents",
            name="escrow_accounts_total_check"
        ),
        CheckConstraint(
            "player1_amount_cents > 0 AND player2_amount_cents > 0",
            name="escrow_accounts_amounts_check"
        ),
    )
