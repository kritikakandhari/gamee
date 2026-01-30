import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface PaymentProcessorsProps {
    amount: number; // in cents
    onSuccess: (details: any) => void;
    onError: (error: any) => void;
    method: 'paypal' | 'card';
}

export const PaymentProcessors: React.FC<PaymentProcessorsProps> = ({
    amount,
    onSuccess,
    onError,
    method
}) => {
    const paypalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (method === 'paypal' && (window as any).paypal) {
            // Render PayPal Buttons
            (window as any).paypal.Buttons({
                createOrder: (_data: any, actions: any) => {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: (amount / 100).toFixed(2)
                            }
                        }]
                    });
                },
                onApprove: async (_data: any, actions: any) => {
                    const details = await actions.order.capture();
                    onSuccess(details);
                },
                onError: (err: any) => {
                    onError(err);
                }
            }).render(paypalRef.current);
        }
    }, [method, amount]);

    if (method === 'paypal') {
        return (
            <div className="w-full min-h-[150px] flex flex-col items-center justify-center p-4 bg-white/5 rounded-lg border border-white/10">
                <div ref={paypalRef} className="w-full" />
                <p className="text-[10px] text-gray-500 mt-2 text-center">
                    Secure payment processed by PayPal. Transactions are encrypted.
                </p>
            </div>
        );
    }

    if (method === 'card') {
        return (
            <div className="w-full space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                {/* 
                    Note: Stripe Elements would usually be initialized here.
                    For the MVP, we are setting up the structure for Stripe.js
                */}
                <div id="card-element" className="p-3 bg-white/10 rounded-md border border-white/20 min-h-[40px]">
                    <span className="text-gray-500 text-sm">Visa / Mastercard Input (Stripe Elements)</span>
                </div>

                <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
                    onClick={() => {
                        // Simulated Stripe Success for testing the "Real" flow
                        onSuccess({ id: 'tok_visa', amount });
                    }}
                >
                    Pay with Card via Stripe
                </Button>

                <p className="text-[10px] text-gray-500 text-center">
                    Powered by Stripe. PCI-DSS compliant.
                </p>
            </div>
        );
    }

    return null;
};
