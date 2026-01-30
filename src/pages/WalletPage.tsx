import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { walletApi, type Wallet, type Transaction } from '@/lib/wallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, History } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useLanguage } from '@/contexts/LanguageContext';


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

    const handleDeposit = async () => {
        // Mock Deposit
        await walletApi.addFunds(10000); // $100.00
        fetchData(); // Refresh
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

                {/* Balance Card */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <WalletIcon className="h-5 w-5 text-purple-400" />
                            {t('app.wallet.balanceTitle')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between">
                            <div>
                                <div className="text-4xl font-bold text-white tracking-tight">
                                    {loading ? '...' : formatCurrency(wallet?.balance_cents || 0)}
                                </div>
                                <p className="text-sm text-gray-400 mt-1">{t('app.wallet.available')}</p>
                            </div>
                            <Button
                                onClick={handleDeposit}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                            >
                                <ArrowDownLeft className="mr-2 h-4 w-4" />
                                {t('app.wallet.addFundsTest')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

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
