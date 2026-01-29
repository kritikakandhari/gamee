"""
Payment endpoints.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.domain.repositories.wallet_repository import WalletRepository
from app.domain.services.wallet_service import WalletService
from app.infrastructure.repositories.wallet_repository_impl import WalletRepositoryImpl
from app.infrastructure.database.session import get_db
from app.api.deps import get_current_user
from app.domain.entities.user import User
from app.domain.entities.payment import TransactionType
from app.schemas.payment import (
    DepositRequest,
    DepositResponse,
    WithdrawalRequest,
    WalletResponse,
    TransactionResponse,
    TransactionListResponse
)
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


async def get_wallet_repository(
    db: AsyncSession = Depends(get_db)
) -> WalletRepository:
    """Dependency for wallet repository."""
    return WalletRepositoryImpl(db)


async def get_wallet_service(
    wallet_repo: WalletRepository = Depends(get_wallet_repository)
) -> WalletService:
    """Dependency for wallet service."""
    return WalletService(wallet_repo)


@router.get("/wallet", response_model=WalletResponse, summary="Get wallet balance")
async def get_wallet(
    current_user: User = Depends(get_current_user),
    wallet_service: WalletService = Depends(get_wallet_service)
):
    """Get wallet balance."""
    wallet = await wallet_service.get_or_create_wallet(current_user.id)
    
    return WalletResponse(
        balance_cents=wallet.balance_cents,
        pending_cents=wallet.pending_cents,
        currency=wallet.currency,
        total_deposited_cents=wallet.total_deposited_cents,
        total_withdrawn_cents=wallet.total_withdrawn_cents
    )


@router.post(
    "/deposit",
    response_model=DepositResponse,
    status_code=201,
    summary="Initiate deposit (Stripe payment intent)"
)
async def initiate_deposit(
    request: DepositRequest,
    current_user: User = Depends(get_current_user),
    wallet_service: WalletService = Depends(get_wallet_service)
):
    """Initiate deposit (Stripe payment intent)."""
    payment_intent, transaction = await wallet_service.initiate_deposit(
        user_id=current_user.id,
        amount_cents=request.amount_cents,
        idempotency_key=request.idempotency_key
    )
    
    return DepositResponse(
        payment_intent_id=payment_intent["payment_intent_id"],
        client_secret=payment_intent["client_secret"],
        amount_cents=payment_intent["amount_cents"],
        currency=payment_intent["currency"],
        status=payment_intent["status"]
    )


@router.post(
    "/withdraw",
    response_model=TransactionResponse,
    status_code=201,
    summary="Request withdrawal"
)
async def request_withdrawal(
    request: WithdrawalRequest,
    current_user: User = Depends(get_current_user),
    wallet_service: WalletService = Depends(get_wallet_service)
):
    """Request withdrawal."""
    transaction = await wallet_service.request_withdrawal(
        user_id=current_user.id,
        amount_cents=request.amount_cents,
        idempotency_key=request.idempotency_key
    )
    
    return TransactionResponse(
        id=transaction.id,
        transaction_type=transaction.transaction_type.value,
        status=transaction.status.value,
        amount_cents=transaction.amount_cents,
        balance_before_cents=transaction.balance_before_cents,
        balance_after_cents=transaction.balance_after_cents,
        description=transaction.description,
        reference_id=transaction.reference_id,
        reference_type=transaction.reference_type,
        created_at=transaction.created_at.isoformat(),
        processed_at=transaction.processed_at.isoformat() if transaction.processed_at else None
    )


@router.get(
    "/transactions",
    response_model=TransactionListResponse,
    summary="Get transaction history"
)
async def get_transactions(
    transaction_type: Optional[str] = Query(None, alias="type"),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    wallet_repo: WalletRepository = Depends(get_wallet_repository)
):
    """Get transaction history."""
    tx_type = None
    if transaction_type:
        try:
            tx_type = TransactionType(transaction_type)
        except ValueError:
            pass
    
    transactions, next_cursor = await wallet_repo.get_user_transactions(
        user_id=current_user.id,
        transaction_type=tx_type,
        limit=limit,
        cursor=cursor
    )
    
    return TransactionListResponse(
        data=[
            TransactionResponse(
                id=t.id,
                transaction_type=t.transaction_type.value,
                status=t.status.value,
                amount_cents=t.amount_cents,
                balance_before_cents=t.balance_before_cents,
                balance_after_cents=t.balance_after_cents,
                description=t.description,
                reference_id=t.reference_id,
                reference_type=t.reference_type,
                created_at=t.created_at.isoformat(),
                processed_at=t.processed_at.isoformat() if t.processed_at else None
            ) for t in transactions
        ],
        meta={
            "pagination": {
                "cursor": next_cursor,
                "has_more": next_cursor is not None
            }
        }
    )
