import { supabase } from '@/lib/supabaseClient';

export type Match = {
    id: string;
    match_type: string;
    status: 'CREATED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    stake_cents: number;
    total_pot_cents: number;
    best_of: number;
    created_by: string;
    accepted_by: string | null;
    winner_id: string | null;
    created_at: string;
    updated_at: string;
    profiles?: {
        username: string;
    };
};

export const matchesApi = {
    // Get all open matches (Status = CREATED)
    getOpenMatches: async () => {
        const { data, error } = await supabase
            .from('matches')
            .select('*, profiles:created_by(username)')
            .eq('status', 'CREATED')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform to match the UI expectations (mapping profiles to participants-ish structure if needed)
        // For now returning raw data, simpler to adapt UI
        return { data };
    },

    // Get User's matches (History + Active)
    getUserMatches: async (userId: string) => {
        // Or condition: Created BY user OR Accepted BY user
        const { data, error } = await supabase
            .from('matches')
            .select('*, profiles!created_by(username), accepted_profile:profiles!accepted_by(username)')
            .or(`created_by.eq.${userId},accepted_by.eq.${userId}`)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return { data };
    },

    // Create a new match
    createMatch: async (params: { match_type: string; stake_cents: number; best_of: number }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('matches')
            .insert({
                created_by: user.id,
                match_type: params.match_type,
                stake_cents: params.stake_cents,
                total_pot_cents: params.stake_cents * 2, // Simple pot calculation
                best_of: params.best_of,
                status: 'CREATED'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Accept a match
    acceptMatch: async (matchId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('matches')
            .update({
                accepted_by: user.id,
                status: 'ACCEPTED',
                updated_at: new Date().toISOString()
            })
            .eq('id', matchId)
            .eq('status', 'CREATED') // Ensure it's still open
            // .neq('created_by', user.id) // Ensure creator can't accept own match (RLS should handle, but good check)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Start a match
    startMatch: async (matchId: string) => {
        const { error } = await supabase
            .from('matches')
            .update({ status: 'IN_PROGRESS', updated_at: new Date().toISOString() })
            .eq('id', matchId);

        if (error) throw error;
    },

    // Complete a match (Claim Victory)
    completeMatch: async (matchId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Call the secure RPC function we just created
        const { data, error } = await supabase
            .rpc('complete_match', {
                match_id: matchId,
                winner_id: user.id
            });

        if (error) throw error;
        return data;
    }
};
