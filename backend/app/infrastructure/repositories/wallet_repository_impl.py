"""
Wallet repository implementation using SQLAlchemy.
"""
from typing import Optional, List, Tuple
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.domain.entities.payment import Wallet, Transaction, TransactionType, TransactionStatus
from app.domain.repositories.wallet_repository import WalletRepository
from app.infrastructure.database.models.wallet import (
    Wallet as WalletModel,
    Transaction as TransactionModel,
    TransactionType as TransactionTypeEnum,
    TransactionStatus as TransactionStatusEnum
)


class WalletRepositoryImpl(WalletRepository):
    """SQLAlchemy implementation of WalletRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_domain_wallet(self, model: WalletModel) -> Wallet:
        """Convert SQLAlchemy model to domain entity."""
        return Wallet(
            id=model.id,
            user_id=model.user_id,
            balance_cents=model.balance_cents,
            pending_cents=model.pending_cents,
            total_deposited_cents=model.total_deposited_cents,
            total_withdrawn_cents=model.total_withdrawn_cents,
            currency=model.currency,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def _to_domain_transaction(self, model: TransactionModel) -> Transaction:
        """Convert SQLAlchemy model to domain entity."""
        return Transaction(
            id=model.id,
            user_id=model.user_id,
            wallet_id=model.wallet_id,
            transaction_type=TransactionType(model.transaction_type.value),
            status=TransactionStatus(model.status.value),
            amount_cents=model.amount_cents,
            balance_before_cents=model.balance_before_cents,
            balance_after_cents=model.balance_after_cents,
            reference_id=model.reference_id,
            reference_type=model.reference_type,
            external_id=model.external_id,
            idempotency_key=model.idempotency_key,
            description=model.description,
            processed_at=model.processed_at,
            created_at=model.created_at
        )
    
    async def get_wallet_by_user_id(self, user_id: UUID) -> Optional[Wallet]:
        """Get wallet by user ID."""
        result = await self.session.execute(
            select(WalletModel).where(WalletModel.user_id == user_id)
        )
        model = result.scalar_one_or_none()
        return self._to_domain_wallet(model) if model else None
    
    async def create_wallet(self, user_id: UUID) -> Wallet:
        """Create a new wallet for user."""
        wallet_model = WalletModel(
            user_id=user_id,
            balance_cents=0,
            pending_cents=0,
            currency="USD"
        )
        self.session.add(wallet_model)
        await self.session.commit()
        await self.session.refresh(wallet_model)
        return self._to_domain_wallet(wallet_model)
    
    async def update_wallet(self, wallet: Wallet) -> Wallet:
        """Update wallet."""
        result = await self.session.execute(
            select(WalletModel).where(WalletModel.id == wallet.id)
        )
        model = result.scalar_one()
        
        model.balance_cents = wallet.balance_cents
        model.pending_cents = wallet.pending_cents
        model.total_deposited_cents = wallet.total_deposited_cents
        model.total_withdrawn_cents = wallet.total_withdrawn_cents
        
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_domain_wallet(model)
    
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
        transaction_model = TransactionModel(
            user_id=user_id,
            wallet_id=wallet_id,
            transaction_type=TransactionTypeEnum(transaction_type.value),
            status=TransactionStatusEnum.PENDING,
            amount_cents=amount_cents,
            balance_before_cents=balance_before_cents,
            balance_after_cents=balance_after_cents,
            idempotency_key=idempotency_key,
            reference_id=reference_id,
            reference_type=reference_type,
            description=description
        )
        
        self.session.add(transaction_model)
        await self.session.commit()
        await self.session.refresh(transaction_model)
        
        return self._to_domain_transaction(transaction_model)
    
    async def get_transaction_by_id(self, transaction_id: UUID) -> Optional[Transaction]:
        """Get transaction by ID."""
        result = await self.session.execute(
            select(TransactionModel).where(TransactionModel.id == transaction_id)
        )
        model = result.scalar_one_or_none()
        return self._to_domain_transaction(model) if model else None
    
    async def get_transaction_by_idempotency_key(self, key: str) -> Optional[Transaction]:
        """Get transaction by idempotency key."""
        result = await self.session.execute(
            select(TransactionModel).where(TransactionModel.idempotency_key == key)
        )
        model = result.scalar_one_or_none()
        return self._to_domain_transaction(model) if model else None
    
    async def get_user_transactions(
        self,
        user_id: UUID,
        transaction_type: Optional[TransactionType] = None,
        limit: int = 20,
        cursor: Optional[str] = None
    ) -> Tuple[List[Transaction], Optional[str]]:
        """Get user's transaction history."""
        query = select(TransactionModel).where(TransactionModel.user_id == user_id)
        
        if transaction_type:
            query = query.where(TransactionModel.transaction_type == TransactionTypeEnum(transaction_type.value))
        
        if cursor:
            try:
                cursor_time = datetime.fromisoformat(cursor)
                query = query.where(TransactionModel.created_at < cursor_time)
            except ValueError:
                pass
        
        query = query.order_by(desc(TransactionModel.created_at)).limit(limit + 1)
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        transactions = [self._to_domain_transaction(m) for m in models[:limit]]
        next_cursor = None
        
        if len(models) > limit:
            next_cursor = models[limit].created_at.isoformat()
        
        return transactions, next_cursor
    
    async def update_transaction_status(
        self,
        transaction_id: UUID,
        status: TransactionStatus,
        external_id: Optional[str] = None
    ) -> Transaction:
        """Update transaction status."""
        result = await self.session.execute(
            select(TransactionModel).where(TransactionModel.id == transaction_id)
        )
        model = result.scalar_one()
        
        model.status = TransactionStatusEnum(status.value)
        if external_id:
            model.external_id = external_id
        if status == TransactionStatus.COMPLETED:
            model.processed_at = datetime.utcnow()
        elif status == TransactionStatus.FAILED:
            model.failed_at = datetime.utcnow()
        
        await self.session.commit()
        await self.session.refresh(model)
        
        return self._to_domain_transaction(model)
