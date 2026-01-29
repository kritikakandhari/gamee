"""
Wallet repository interface.
"""
from abc import ABC, abstractmethod
from typing import Optional, List, Tuple
from uuid import UUID

from app.domain.entities.payment import Wallet, Transaction, TransactionType, TransactionStatus


class WalletRepository(ABC):
    """Interface for wallet repository operations."""
    
    @abstractmethod
    async def get_wallet_by_user_id(self, user_id: UUID) -> Optional[Wallet]:
        """Get wallet by user ID."""
        pass
    
    @abstractmethod
    async def create_wallet(self, user_id: UUID) -> Wallet:
        """Create a new wallet for user."""
        pass
    
    @abstractmethod
    async def update_wallet(self, wallet: Wallet) -> Wallet:
        """Update wallet."""
        pass
    
    @abstractmethod
    async def create_transaction(
        self,
        user_id: UUID,
        wallet_id: UUID,
        transaction_type: TransactionType,
        amount_cents: int,
        balance_before_cents: int,
        balance_after_cents: int,
        idempotency_key: Optional[str] = None,
        reference_id: Optional[UUID] = None,
        reference_type: Optional[str] = None,
        description: Optional[str] = None
    ) -> Transaction:
        """Create a transaction."""
        pass
    
    @abstractmethod
    async def get_transaction_by_id(self, transaction_id: UUID) -> Optional[Transaction]:
        """Get transaction by ID."""
        pass
    
    @abstractmethod
    async def get_transaction_by_idempotency_key(self, key: str) -> Optional[Transaction]:
        """Get transaction by idempotency key."""
        pass
    
    @abstractmethod
    async def get_user_transactions(
        self,
        user_id: UUID,
        transaction_type: Optional[TransactionType] = None,
        limit: int = 20,
        cursor: Optional[str] = None
    ) -> Tuple[List[Transaction], Optional[str]]:
        """Get user's transaction history."""
        pass
    
    @abstractmethod
    async def update_transaction_status(
        self,
        transaction_id: UUID,
        status: TransactionStatus,
        external_id: Optional[str] = None
    ) -> Transaction:
        """Update transaction status."""
        pass
