import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { walletApi, type Wallet, type Transaction } from '@/lib/wallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, History } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { PaymentProcessors } from '@/components/payments/PaymentProcessors';
import { WithdrawDialog } from '@/components/payments/WithdrawDialog';
import { useWallet } from '@/hooks/useWallet';


export default function WalletPage() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { wallet, balance, formattedBalance, loading: walletLoading, refresh } = useWallet();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const txData = await walletApi.getTransactions();
            setTransactions(txData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const [depositAmount, setDepositAmount] = useState<string>('25');
    const [selectedMethod, setSelectedMethod] = useState<'card' | 'paypal' | 'razorpay' | 'crypto'>('card');

    const presetAmounts = [10, 25, 50, 100];

    const handlePaymentSuccess = async (details: any) => {
        try {
            const amount = parseFloat(depositAmount);
            // Sync with Supabase Wallet Ledger
            await walletApi.addFunds(Math.round(amount * 100));
            await fetchData(); // Refresh balance
            console.log('Payment Successful:', details);
        } catch (err) {
            console.error('Wallet sync error:', err);
        }
    };

    const handlePaymentError = (error: any) => {
        console.error('Payment failed:', error);
    };

    const formatCurrency = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`;
    };

    return (
        <PageLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-400">
                        {t('app.wallet.title')}
                    </h1>
                    <p className="text-gray-400">{t('app.wallet.subtitle')}</p>
                </div>

                {/* Deposit Section */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Balance Card */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md flex flex-col justify-between">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <WalletIcon className="h-5 w-5 text-purple-400" />
                                {t('app.wallet.balanceTitle')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-5xl font-bold text-white tracking-tight">
                                {walletLoading ? '...' : formattedBalance}
                            </div>
                            <p className="text-sm text-gray-400 mt-2">{t('app.wallet.available')}</p>

                            <div className="mt-8 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 space-y-4">
                                <p className="text-xs text-purple-200/70 leading-relaxed">
                                    <span className="font-bold text-purple-300">Monetization Note:</span> A 5% service fee is applied to match prizes to support the platform.
                                </p>
                                <WithdrawDialog
                                    maxAmountCents={wallet?.balance_cents || 0}
                                    onSuccess={fetchData}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Deposit Card */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="text-white text-lg">Add Funds</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Preset Buttons */}
                            <div className="grid grid-cols-4 gap-2">
                                {presetAmounts.map((amt) => (
                                    <Button
                                        key={amt}
                                        variant="outline"
                                        onClick={() => setDepositAmount(amt.toString())}
                                        className={cn(
                                            "border-white/10 bg-white/5 hover:bg-white/10 text-white",
                                            depositAmount === amt.toString() && "border-purple-500 bg-purple-500/20"
                                        )}
                                    >
                                        ${amt}
                                    </Button>
                                ))}
                            </div>

                            {/* Custom Amount */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Custom Amount (Min $5.00)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-md py-2 pl-7 pr-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Method Selector */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Payment Method</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['card', 'paypal', 'razorpay', 'crypto'].map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setSelectedMethod(m as any)}
                                            className={cn(
                                                "p-2 rounded-md border border-white/10 bg-white hover:bg-white/90 transition-all flex items-center justify-center h-10 w-full",
                                                selectedMethod === m && "ring-2 ring-purple-500 border-transparent"
                                            )}
                                        >
                                            <img
                                                src={m === 'card' ? 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg' :
                                                    m === 'paypal' ? 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg' :
                                                        m === 'razorpay' ? 'https://razorpay.com/favicon.png' :
                                                            'https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg'}
                                                className="h-5 w-auto object-contain"
                                                alt={m}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Real Payment Processor Integration */}
                            <div className="pt-4 border-t border-white/10">
                                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                                    Secure Checkout via {
                                        selectedMethod === 'card' ? 'Stripe' :
                                            selectedMethod === 'paypal' ? 'PayPal' :
                                                selectedMethod === 'razorpay' ? 'Razorpay' :
                                                    'Bitcoin'
                                    }
                                </p>
                                <PaymentProcessors
                                    amount={Math.round(parseFloat(depositAmount || '0') * 100)}
                                    method={selectedMethod}
                                    onSuccess={handlePaymentSuccess}
                                    onError={handlePaymentError}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Monetization / Service Fee Info */}
                    <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-white/10 mt-4">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-white">Platform Service Fee</h4>
                                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                        FGCMM charges a flat <strong>5% service fee</strong> on all match payouts. This fee supports our high-risk payment infrastructure, server maintenance, and advanced anti-cheat systems.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transactions List */}
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <History className="h-5 w-5" />
                        {t('app.wallet.recentTransactions')}
                    </h2>
                    <div className="space-y-3">
                        {!loading && transactions.length === 0 && (
                            <div className="text-center py-8 text-gray-500 bg-white/5 rounded-lg border border-white/5">
                                {t('app.wallet.noTransactions')}
                            </div>
                        )}
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${tx.amount_cents > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {tx.amount_cents > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{tx.description || tx.type.replace('_', ' ')}</div>
                                        <div className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className={`font-mono font-medium ${tx.amount_cents > 0 ? 'text-green-400' : 'text-white'}`}>
                                    {tx.amount_cents > 0 ? '+' : ''}{formatCurrency(tx.amount_cents)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
