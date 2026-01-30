import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { walletApi, type Wallet, type Transaction } from '@/lib/wallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, History } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';


export default function WalletPage() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [walletData, txData] = await Promise.all([
                walletApi.getWallet(),
                walletApi.getTransactions()
            ]);
            setWallet(walletData);
            setTransactions(txData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const [depositAmount, setDepositAmount] = useState<string>('25');
    const [selectedMethod, setSelectedMethod] = useState<'card' | 'paypal' | 'crypto'>('card');
    const [submitting, setSubmitting] = useState(false);

    const presetAmounts = [10, 25, 50, 100];

    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount < 5) return;

        try {
            setSubmitting(true);
            // Mock Deposit
            await walletApi.addFunds(Math.round(amount * 100)); // Convert to cents
            await fetchData(); // Refresh
            setSubmitting(false);
        } catch (err) {
            console.error(err);
            setSubmitting(false);
        }
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
                                {loading ? '...' : formatCurrency(wallet?.balance_cents || 0)}
                            </div>
                            <p className="text-sm text-gray-400 mt-2">{t('app.wallet.available')}</p>

                            <div className="mt-8 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <p className="text-xs text-purple-200/70 leading-relaxed">
                                    <span className="font-bold text-purple-300">Monetization Note:</span> A 5% service fee is applied to match prizes to support the platform and anti-cheat infrastructure.
                                </p>
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
                                <div className="grid grid-cols-3 gap-2">
                                    {['card', 'paypal', 'crypto'].map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setSelectedMethod(m as any)}
                                            className={cn(
                                                "p-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center",
                                                selectedMethod === m && "border-purple-500 bg-purple-500/20"
                                            )}
                                        >
                                            <img
                                                src={m === 'card' ? 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg' :
                                                    m === 'paypal' ? 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg' :
                                                        'https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg'}
                                                className="h-4 opacity-70 grayscale contrast-125"
                                                alt={m}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleDeposit}
                                disabled={submitting || !depositAmount || parseFloat(depositAmount) < 5}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold h-12"
                            >
                                {submitting ? 'Processing...' : `Deposit $${depositAmount || '0.00'}`}
                            </Button>
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
