import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

interface StripeCardFormProps {
    amount: number;
    onSuccess: (details: any) => void;
    onError: (error: any) => void;
}

export const StripeCardForm: React.FC<StripeCardFormProps> = ({ amount, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setLoading(true);

        try {
            // 1. Call Supabase Edge Function to get PaymentIntent Client Secret
            // Note: This function needs to be deployed by the user
            const { data, error: functionError } = await supabase.functions.invoke('stripe-payment-intent', {
                body: { amount, currency: 'usd' }
            });

            if (functionError) throw functionError;

            const clientSecret = data.clientSecret;

            // 2. Confirm Payment with Stripe
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)!,
                }
            });

            if (result.error) {
                onError(result.error);
            } else {
                if (result.paymentIntent.status === 'succeeded') {
                    onSuccess(result.paymentIntent);
                }
            }
        } catch (err) {
            console.error('Stripe Error:', err);
            onError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-white/10 rounded-md border border-white/20">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#ffffff',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                        },
                    }}
                />
            </div>

            <Button
                type="submit"
                disabled={!stripe || loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold h-11"
            >
                {loading ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)} with Card`}
            </Button>

            <p className="text-[10px] text-gray-500 text-center">
                Powered by Stripe. PCI-DSS compliant. Secure payment.
            </p>
        </form>
    );
};
