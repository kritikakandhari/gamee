import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface PlayerStats {
    winRate: number;
    currentStreak: number;
    headToHead: { wins: number; losses: number };
    recentForm: ('W' | 'L')[];
}

export function usePlayerPerformance(playerId: string | undefined, opponentId: string | undefined) {
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!playerId) return;

        const fetchStats = async () => {
            try {
                setLoading(true);

                // 1. Fetch recent matches for form & streak
                const { data: matches } = await supabase
                    .from('matches')
                    .select('winner_id, created_by, accepted_by')
                    .or(`created_by.eq.${playerId},accepted_by.eq.${playerId}`)
                    .eq('status', 'COMPLETED')
                    .order('completed_at', { ascending: false })
                    .limit(20);

                if (!matches || matches.length === 0) {
                    setStats({
                        winRate: 0,
                        currentStreak: 0,
                        headToHead: { wins: 0, losses: 0 },
                        recentForm: []
                    });
                    return;
                }

                // Calculate Win Rate (last 20 matches)
                const wins = matches.filter(m => m.winner_id === playerId).length;
                const winRate = Math.round((wins / matches.length) * 100);

                // Calculate Streak
                let streak = 0;
                for (const m of matches) {
                    if (m.winner_id === playerId) streak++;
                    else break;
                }

                // Calculate Head-to-Head (if opponent exists)
                let h2h = { wins: 0, losses: 0 };
                if (opponentId) {
                    const h2hMatches = matches.filter(m =>
                        (m.player1_id === opponentId || m.player2_id === opponentId)
                    );
                    const h2hWins = h2hMatches.filter(m => m.winner_id === playerId).length;
                    h2h = { wins: h2hWins, losses: h2hMatches.length - h2hWins };
                }

                // Recent Form (Last 5)
                const form = matches.slice(0, 5).map(m => m.winner_id === playerId ? 'W' : 'L') as ('W' | 'L')[];

                setStats({
                    winRate,
                    currentStreak: streak,
                    headToHead: h2h,
                    recentForm: form
                });

            } catch (err) {
                console.error('Error fetching player stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [playerId, opponentId]);

    return { stats, loading };
}
