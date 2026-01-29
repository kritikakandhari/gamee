"""
Payment request/response schemas.
"""
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from uuid import UUID


class DepositRequest(BaseModel):
    """Deposit request."""
    amount_cents: int = Field(..., ge=100, le=1000000, description="Amount in cents ($1.00 - $10,000.00)")
    idempotency_key: str = Field(..., description="Unique key to prevent duplicate charges")


class WithdrawalRequest(BaseModel):
    """Withdrawal request."""
    amount_cents: int = Field(..., ge=100, description="Amount in cents (minimum $1.00)")
    idempotency_key: str = Field(..., description="Unique key to prevent duplicate withdrawals")


class WalletResponse(BaseModel):
    """Wallet response."""
    balance_cents: int
    pending_cents: int
    currency: str
    total_deposited_cents: int
    total_withdrawn_cents: int
    
    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    """Transaction response."""
    id: UUID
    transaction_type: str
    status: str
    amount_cents: int
    balance_before_cents: int
    balance_after_cents: int
    description: Optional[str]
    reference_id: Optional[UUID]
    reference_type: Optional[str]
    created_at: str
    processed_at: Optional[str]
    
    class Config:
        from_attributes = True


class DepositResponse(BaseModel):
    """Deposit response."""
    payment_intent_id: str
    client_secret: str
    amount_cents: int
    currency: str
    status: str


class TransactionListResponse(BaseModel):
    """Transaction list response."""
    data: List[TransactionResponse]
    meta: dict = Field(default_factory=dict)
