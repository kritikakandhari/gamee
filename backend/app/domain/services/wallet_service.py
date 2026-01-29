"""
Wallet service.
Handles wallet operations, deposits, withdrawals, and balance management.
"""
from typing import Optional, Tuple
from uuid import UUID, uuid4
from datetime import datetime

from app.domain.entities.payment import Wallet, Transaction, TransactionType, TransactionStatus
from app.domain.repositories.wallet_repository import WalletRepository
from app.infrastructure.external.payment_gateway import PaymentGateway, get_payment_gateway
from app.core.exceptions import (
    BusinessLogicError,
    NotFoundError,
    ValidationError,
    PaymentError,
    ConflictError
)


class WalletService:
    """Wallet service."""
    
    def __init__(
        self,
        wallet_repository: WalletRepository,
        payment_gateway: Optional[PaymentGateway] = None
    ):
        self.wallet_repository = wallet_repository
        self.payment_gateway = payment_gateway or get_payment_gateway()
    
    async def get_or_create_wallet(self, user_id: UUID) -> Wallet:
        """Get wallet for user, create if doesn't exist."""
        wallet = await self.wallet_repository.get_wallet_by_user_id(user_id)
        if not wallet:
            wallet = await self.wallet_repository.create_wallet(user_id)
        return wallet
    
    async def get_wallet(self, user_id: UUID) -> Wallet:
        """Get wallet for user."""
        wallet = await self.wallet_repository.get_wallet_by_user_id(user_id)
        if not wallet:
            raise NotFoundError("Wallet", str(user_id))
        return wallet
    
    async def initiate_deposit(
        self,
        user_id: UUID,
        amount_cents: int,
        idempotency_key: str
    ) -> Tuple[dict, Transaction]:
        """
        Initiate a deposit.
        
        Returns:
            Tuple of (payment_intent_data, transaction)
        """
        # Validate amount
        if amount_cents < 100:  # $1.00 minimum
            raise ValidationError("Minimum deposit is $1.00", field="amount_cents")
        if amount_cents > 1000000:  # $10,000.00 maximum
            raise ValidationError("Maximum deposit is $10,000.00", field="amount_cents")
        
        # Check for duplicate idempotency key
        existing = await self.wallet_repository.get_transaction_by_idempotency_key(idempotency_key)
        if existing:
            raise ConflictError("Duplicate idempotency key", code="IDEMPOTENCY_CONFLICT")
        
        # Get or create wallet
        wallet = await self.get_or_create_wallet(user_id)
        
        # Create payment intent
        payment_intent = await self.payment_gateway.create_payment_intent(
            amount_cents=amount_cents,
            currency="usd",
            metadata={
                "user_id": str(user_id),
                "idempotency_key": idempotency_key
            }
        )
        
        # Create pending transaction
        transaction = await self.wallet_repository.create_transaction(
            user_id=user_id,
            wallet_id=wallet.id,
            transaction_type=TransactionType.DEPOSIT,
            amount_cents=amount_cents,
            balance_before_cents=wallet.balance_cents,
            balance_after_cents=wallet.balance_cents,  # No change until confirmed
            idempotency_key=idempotency_key,
            description=f"Deposit of ${amount_cents / 100:.2f}"
        )
        
        return payment_intent, transaction
    
    async def confirm_deposit(
        self,
        payment_intent_id: str,
        user_id: UUID
    ) -> Transaction:
        """
        Confirm a deposit after payment intent succeeds.
        Called from webhook handler.
        """
        # Get payment intent status
        payment_intent = await self.payment_gateway.confirm_payment_intent(payment_intent_id)
        
        if payment_intent["status"] != "succeeded":
            raise PaymentError(f"Payment intent not succeeded: {payment_intent['status']}")
        
        amount_cents = payment_intent["amount_cents"]
        
        # Find transaction by external_id
        # For now, we'll need to add a method to find by external_id
        # Or store payment_intent_id in transaction metadata
        
        # Get wallet
        wallet = await self.get_wallet(user_id)
        
        # Update wallet balance
        wallet.balance_cents += amount_cents
        wallet.total_deposited_cents += amount_cents
        
        updated_wallet = await self.wallet_repository.update_wallet(wallet)
        
        # Create completed transaction
        transaction = await self.wallet_repository.create_transaction(
            user_id=user_id,
            wallet_id=wallet.id,
            transaction_type=TransactionType.DEPOSIT,
            amount_cents=amount_cents,
            balance_before_cents=wallet.balance_cents - amount_cents,
            balance_after_cents=updated_wallet.balance_cents,
            reference_id=None,
            reference_type="payment",
            external_id=payment_intent_id,
            description=f"Deposit confirmed: ${amount_cents / 100:.2f}"
        )
        
        # Update transaction status
        await self.wallet_repository.update_transaction_status(
            transaction.id,
            TransactionStatus.COMPLETED,
            external_id=payment_intent_id
        )
        
        return transaction
    
    async def debit_wallet(
        self,
        user_id: UUID,
        amount_cents: int,
        transaction_type: TransactionType,
        idempotency_key: Optional[str] = None,
        reference_id: Optional[UUID] = None,
        reference_type: Optional[str] = None,
        description: Optional[str] = None
    ) -> Transaction:
        """
        Debit wallet (for match entry, etc.).
        Transaction-safe operation.
        """
        wallet = await self.get_wallet(user_id)
        
        if not wallet.has_sufficient_balance(amount_cents):
            raise PaymentError(
                f"Insufficient balance. Required: ${amount_cents / 100:.2f}, Available: ${wallet.balance_cents / 100:.2f}",
                code="INSUFFICIENT_BALANCE"
            )
        
        # Check idempotency if provided
        if idempotency_key:
            existing = await self.wallet_repository.get_transaction_by_idempotency_key(idempotency_key)
            if existing:
                return existing
        
        # Update wallet
        balance_before = wallet.balance_cents
        wallet.balance_cents -= amount_cents
        
        updated_wallet = await self.wallet_repository.update_wallet(wallet)
        
        # Create transaction
        transaction = await self.wallet_repository.create_transaction(
            user_id=user_id,
            wallet_id=wallet.id,
            transaction_type=transaction_type,
            amount_cents=-amount_cents,  # Negative for debit
            balance_before_cents=balance_before,
            balance_after_cents=updated_wallet.balance_cents,
            idempotency_key=idempotency_key,
            reference_id=reference_id,
            reference_type=reference_type,
            description=description
        )
        
        # Mark as completed immediately (internal transaction)
        await self.wallet_repository.update_transaction_status(
            transaction.id,
            TransactionStatus.COMPLETED
        )
        
        return transaction
    
    async def credit_wallet(
        self,
        user_id: UUID,
        amount_cents: int,
        transaction_type: TransactionType,
        idempotency_key: Optional[str] = None,
        reference_id: Optional[UUID] = None,
        reference_type: Optional[str] = None,
        description: Optional[str] = None
    ) -> Transaction:
        """
        Credit wallet (for match win, refund, etc.).
        Transaction-safe operation.
        """
        wallet = await self.get_wallet(user_id)
        
        # Check idempotency if provided
        if idempotency_key:
            existing = await self.wallet_repository.get_transaction_by_idempotency_key(idempotency_key)
            if existing:
                return existing
        
        # Update wallet
        balance_before = wallet.balance_cents
        wallet.balance_cents += amount_cents
        
        if transaction_type == TransactionType.MATCH_WIN:
            # Track earnings (for ranking)
            pass  # Will be handled in ranking update
        
        updated_wallet = await self.wallet_repository.update_wallet(wallet)
        
        # Create transaction
        transaction = await self.wallet_repository.create_transaction(
            user_id=user_id,
            wallet_id=wallet.id,
            transaction_type=transaction_type,
            amount_cents=amount_cents,  # Positive for credit
            balance_before_cents=balance_before,
            balance_after_cents=updated_wallet.balance_cents,
            idempotency_key=idempotency_key,
            reference_id=reference_id,
            reference_type=reference_type,
            description=description
        )
        
        # Mark as completed immediately
        await self.wallet_repository.update_transaction_status(
            transaction.id,
            TransactionStatus.COMPLETED
        )
        
        return transaction
    
    async def request_withdrawal(
        self,
        user_id: UUID,
        amount_cents: int,
        idempotency_key: str
    ) -> Transaction:
        """
        Request a withdrawal.
        Funds are moved to pending, actual transfer happens asynchronously.
        """
        # Validate amount
        if amount_cents < 100:
            raise ValidationError("Minimum withdrawal is $1.00", field="amount_cents")
        
        # Check idempotency
        existing = await self.wallet_repository.get_transaction_by_idempotency_key(idempotency_key)
        if existing:
            raise ConflictError("Duplicate idempotency key", code="IDEMPOTENCY_CONFLICT")
        
        wallet = await self.get_wallet(user_id)
        
        if not wallet.has_sufficient_balance(amount_cents):
            raise PaymentError(
                f"Insufficient balance. Required: ${amount_cents / 100:.2f}, Available: ${wallet.balance_cents / 100:.2f}",
                code="INSUFFICIENT_BALANCE"
            )
        
        # Move to pending
        balance_before = wallet.balance_cents
        wallet.balance_cents -= amount_cents
        wallet.pending_cents += amount_cents
        
        updated_wallet = await self.wallet_repository.update_wallet(wallet)
        
        # Create transaction
        transaction = await self.wallet_repository.create_transaction(
            user_id=user_id,
            wallet_id=wallet.id,
            transaction_type=TransactionType.WITHDRAWAL,
            amount_cents=-amount_cents,
            balance_before_cents=balance_before,
            balance_after_cents=updated_wallet.balance_cents,
            idempotency_key=idempotency_key,
            description=f"Withdrawal request: ${amount_cents / 100:.2f}"
        )
        
        # TODO: Process withdrawal asynchronously (background job)
        # For MVP, we'll mark as processing
        
        await self.wallet_repository.update_transaction_status(
            transaction.id,
            TransactionStatus.PROCESSING
        )
        
        return transaction
