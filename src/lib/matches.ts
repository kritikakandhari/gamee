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
    platform: string;
    is_private: boolean;
    room_code: string | null;
    rules: string | null;
    spectator_chat_enabled: boolean;
    twitch_url?: string;
    player2_id?: string;
    profiles?: {
        id?: string;
        username: string;
        reputation?: number;
    };
};

export const matchesApi = {
    // Fetch single match by ID
    getMatchById: async (matchId: string): Promise<Match> => {
        const { data, error } = await supabase
            .from('matches')
            .select(`
                *,
                profiles:created_by (
                    username,
                    reputation
                )
            `)
            .eq('id', matchId)
            .single();

        if (error) throw error;
        return data as Match;
    },

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

    // Create a new match (Secure with Fee)
    createMatch: async (params: {
        game: string;
        match_type: string;
        stake_cents: number;
        best_of: number;
        platform?: string;
        is_private?: boolean;
        rules?: string;
        spectator_chat_enabled?: boolean;
        twitch_url?: string;
    }) => {
        const { data, error } = await supabase
            .rpc('create_match_with_wallet', {
                p_game: params.game,
                p_match_type: params.match_type,
                p_stake_cents: Math.floor(params.stake_cents),
                p_best_of: Math.floor(params.best_of),
                p_platform: params.platform || 'PC',
                p_is_private: params.is_private || false,
                p_rules: params.rules || '',
                p_spectator_chat_enabled: params.spectator_chat_enabled ?? true,
                p_twitch_url: params.twitch_url || null
            });

        if (error) throw error;
        return data; // Returns { success: true, match_id: ... }
    },

    // Accept a match (Secure with Fee)
    acceptMatch: async (matchId: string) => {
        const { data, error } = await supabase
            .rpc('join_match_with_wallet', { p_match_id: matchId });

        if (error) throw error;
        return data;
    },

    // Join by Room Code
    joinByRoomCode: async (roomCode: string) => {
        // First find match ID by room code
        const { data: match, error: fetchError } = await supabase
            .from('matches')
            .select('id')
            .eq('room_code', roomCode.toUpperCase())
            .single();

        if (fetchError || !match) throw new Error("Match not found or invalid room code");

        const { data, error } = await supabase
            .rpc('join_match_with_wallet', { p_match_id: match.id });

        if (error) throw error;
        return data;
    },

    // Start a match (Unlock for play)
    startMatch: async (matchId: string) => {
        const { error } = await supabase
            .from('matches')
            .update({ status: 'IN_PROGRESS', updated_at: new Date().toISOString() })
            .eq('id', matchId);

        if (error) throw error;
    },

    // Complete a match (Claim Victory & Payout)
    completeMatch: async (matchId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // 1. Process Payouts (The Financial Transaction)
        // Note: The RPC on the backend should handle the 5% service fee deduction.
        // For the UI, we assume the backend deducts it from the total pot.
        const { data, error } = await supabase
            .rpc('complete_match_with_payout', {
                p_match_id: matchId,
                p_winner_id: user.id
            });

        if (error) throw error;

        // 2. [AI LAYER] Simulate Game Client uploading stats
        const isSuspicious = Math.random() > 0.9; // Reduced for real-world feel
        const simDuration = isSuspicious ? 15 : 450;
        const simApm = Math.floor(Math.random() * 400) + 100;

        await supabase.from('match_stats').insert({
            match_id: matchId,
            player_id: user.id,
            duration_seconds: simDuration,
            apm: simApm,
            damage_dealt: 5000,
            damage_taken: 3000
        });

        return data;
    },

    // Find suggested matches based on skill/ability
    getSuggestedMatches: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: [] };

        const { data, error } = await supabase
            .rpc('find_suggested_matches', { p_user_id: user.id });

        if (error) throw error;
        return { data };
    },

    // Apply penalties for leaving a match early
    applyLeavePenalty: async (matchId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .rpc('apply_match_leave_penalty', {
                p_match_id: matchId,
                p_user_id: user.id
            });

        if (error) throw error;
        return data;
    }
};
