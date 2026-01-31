import { supabase } from '@/lib/supabaseClient';

export type Transaction = {
    id: string;
    amount_cents: number;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'ENTRY_FEE' | 'PAYOUT' | 'REFUND';
    description: string;
    created_at: string;
};

export type Wallet = {
    id: string;
    balance_cents: number;
};

export const walletApi = {
    // Get User's Wallet
    getWallet: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) throw error;
        return data as Wallet;
    },

    // Get Transaction History
    getTransactions: async () => {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Transaction[];
    },

    // Mock Deposit (Test Money)
    addFunds: async (amountCents: number) => {
        const { data, error } = await supabase
            .rpc('mock_deposit', { amount_cents: amountCents });

        if (error) throw error;
        return data;
    },

    // Request Real Withdrawal
    requestWithdrawal: async (amountCents: number, method: string, details: any) => {
        const { data, error } = await supabase
            .rpc('request_withdrawal', {
                p_amount_cents: amountCents,
                p_method: method,
                p_account_details: details
            });

        if (error) throw error;
        return data;
    }
};
