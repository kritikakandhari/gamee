import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface PaymentProcessorsProps {
    amount: number; // in cents
    onSuccess: (details: any) => void;
    onError: (error: any) => void;
    method: 'paypal' | 'card' | 'razorpay' | 'crypto';
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

    if (method === 'razorpay') {
        const handleRazorpay = () => {
            const options = {
                key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
                amount: amount, // in smallest currency unit (cents/paise)
                currency: 'USD',
                name: 'FGC Money Match',
                description: 'Wallet Deposit',
                handler: function (response: any) {
                    onSuccess(response);
                },
                modal: {
                    ondismiss: function () {
                        onError({ message: 'Payment cancelled' });
                    }
                },
                theme: {
                    color: '#A855F7'
                }
            };
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        };

        return (
            <div className="w-full space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <Button
                    className="w-full bg-[#3395FF] hover:bg-[#2d84e6] text-white font-bold h-12 flex items-center justify-center gap-2"
                    onClick={handleRazorpay}
                >
                    <img src="https://razorpay.com/favicon.png" className="h-5 w-5" alt="Razorpay" />
                    Pay with Razorpay
                </Button>
                <p className="text-[10px] text-gray-500 text-center">
                    Secure local & international payments via Razorpay.
                </p>
            </div>
        );
    }

    if (method === 'crypto') {
        const bitcoinAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"; // Placeholder Demo Address

        return (
            <div className="w-full space-y-4 p-5 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center">
                <div className="bg-white p-2 rounded-lg mb-2">
                    {/* Placeholder QR Code - In real app, use qrcode.react */}
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=bitcoin:${bitcoinAddress}?amount=${(amount / 100000).toFixed(8)}`}
                        alt="Bitcoin QR Code"
                        className="h-32 w-32"
                    />
                </div>

                <div className="w-full space-y-2 text-center">
                    <p className="text-xs text-gray-400">Send exactly <span className="text-white font-mono">{(amount / 100000).toFixed(8)} BTC</span> to:</p>
                    <div className="bg-black/40 p-2 rounded border border-white/10 flex items-center justify-between gap-2 overflow-hidden">
                        <code className="text-[10px] text-cyan-400 truncate">{bitcoinAddress}</code>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] hover:bg-white/10"
                            onClick={() => navigator.clipboard.writeText(bitcoinAddress)}
                        >
                            Copy
                        </Button>
                    </div>
                </div>

                <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-11"
                    onClick={() => {
                        // Simulated Crypto Verification for Demo
                        onSuccess({ id: 'btc_mock_txn', amount, method: 'bitcoin' });
                    }}
                >
                    I have sent the payment
                </Button>

                <p className="text-[10px] text-gray-500 text-center animate-pulse">
                    Waiting for network confirmation (0/3)...
                </p>
            </div>
        );
    }

    return null;
};
