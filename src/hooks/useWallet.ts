import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { walletApi, type Wallet } from '@/lib/wallet';
import { useAuth } from '@/auth/AuthProvider';

export function useWallet() {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchWallet = async () => {
        if (!user) return;
        try {
            const data = await walletApi.getWallet();
            setWallet(data);
        } catch (err) {
            console.error('Failed to fetch wallet:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            setWallet(null);
            setLoading(false);
            return;
        }

        fetchWallet();

        // Subscribe to wallet changes
        const channel = supabase
            .channel(`wallet:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'wallets',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    setWallet(payload.new as Wallet);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    return {
        wallet,
        loading,
        balance: wallet?.balance_cents || 0,
        formattedBalance: `$${((wallet?.balance_cents || 0) / 100).toFixed(2)}`,
        refresh: fetchWallet
    };
}
