import { supabase } from '@/lib/supabaseClient';

export type IntegrityLog = {
    id: string;
    match_id: string;
    user_id: string;
    flag_reason: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    details: any;
    status: 'PENDING' | 'REVIEWED' | 'BANNED' | 'DISMISSED';
    created_at: string;
    profiles?: {
        username: string;
        avatar_url: string;
    };
};

export const adminApi = {
    // Get Flagged Integrity Logs
    getIntegrityLogs: async () => {
        const { data, error } = await supabase
            .from('integrity_logs')
            .select('*, profiles:user_id(username, avatar_url, id)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as IntegrityLog[];
    },

    // Get Disputes (Future)
    getDisputes: async () => {
        const { data, error } = await supabase
            .from('disputes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Review/Resolve a Flag
    resolveFlag: async (logId: string, action: 'DISMISS' | 'BAN') => {
        const status = action === 'BAN' ? 'BANNED' : 'REVIEWED';
        const { error } = await supabase
            .from('integrity_logs')
            .update({ status })
            .eq('id', logId);

        if (error) throw error;
    },

    // Get App Analytics (View)
    getAnalytics: async () => {
        const { data, error } = await supabase
            .from('app_analytics')
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    // Get All Support Tickets
    getSupportTickets: async () => {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*, profiles:user_id(username, avatar_url)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Resolve Support Ticket
    resolveTicket: async (ticketId: string, status: string) => {
        const { error } = await supabase
            .rpc('resolve_support_ticket', {
                p_ticket_id: ticketId,
                p_status: status
            });

        if (error) throw error;
    },

    // Withdrawal Management
    getWithdrawalRequests: async () => {
        const { data, error } = await supabase
            .from('withdrawal_requests')
            .select('*, profiles:user_id(username)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    resolveWithdrawal: async (id: string, status: 'PAID' | 'REJECTED', notes: string = '') => {
        const { error } = await supabase
            .from('withdrawal_requests')
            .update({ status, admin_notes: notes, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        // If rejected, we should technically refund the cents, but for this demo 
        // we assume the admin handles the ledger. 
        // In real app, rejection would trigger a refund RPC.
    }
};
