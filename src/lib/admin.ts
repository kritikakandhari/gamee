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
    }
};
