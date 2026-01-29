"""
Payment gateway abstraction.
Supports Stripe now, can be extended for other providers.
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from uuid import UUID

import stripe
from app.core.config import settings

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentGateway(ABC):
    """Payment gateway interface."""
    
    @abstractmethod
    async def create_payment_intent(
        self,
        amount_cents: int,
        currency: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a payment intent for deposit."""
        pass
    
    @abstractmethod
    async def confirm_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """Confirm a payment intent."""
        pass
    
    @abstractmethod
    async def create_transfer(
        self,
        amount_cents: int,
        destination_account: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a transfer (for withdrawals)."""
        pass


class StripePaymentGateway(PaymentGateway):
    """Stripe implementation of payment gateway."""
    
    async def create_payment_intent(
        self,
        amount_cents: int,
        currency: str = "usd",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a Stripe payment intent."""
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency,
                metadata=metadata or {},
                automatic_payment_methods={
                    "enabled": True,
                },
            )
            return {
                "payment_intent_id": intent.id,
                "client_secret": intent.client_secret,
                "status": intent.status,
                "amount_cents": amount_cents,
                "currency": currency,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
    
    async def confirm_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """Confirm a Stripe payment intent."""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                "id": intent.id,
                "status": intent.status,
                "amount_cents": intent.amount,
                "currency": intent.currency,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
    
    async def create_transfer(
        self,
        amount_cents: int,
        destination_account: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a Stripe transfer (for withdrawals)."""
        # Note: In production, you'd use Stripe Connect for transfers
        # For MVP, we'll use a simplified approach
        try:
            # This is a placeholder - actual implementation depends on Stripe Connect setup
            transfer = stripe.Transfer.create(
                amount=amount_cents,
                currency="usd",
                destination=destination_account,
                metadata=metadata or {},
            )
            return {
                "transfer_id": transfer.id,
                "status": transfer.status,
                "amount_cents": amount_cents,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")


# Factory function
def get_payment_gateway() -> PaymentGateway:
    """Get payment gateway instance."""
    return StripePaymentGateway()
