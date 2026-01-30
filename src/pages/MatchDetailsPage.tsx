import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Swords,
    Trophy,
    Copy,
    Check,
    Play,
    CheckCircle,
    AlertTriangle,
    Monitor,
    Smartphone
} from 'lucide-react';
import { matchesApi } from '@/lib/matches';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MatchMessaging } from '@/components/matches/MatchMessaging';
import { WinProbabilityEstimator } from '@/components/matches/WinProbabilityEstimator';

export default function MatchDetailsPage() {
    const { matchId } = useParams<{ matchId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [copied, setCopied] = useState(false);

    const { data: match, isLoading, error } = useQuery({
        queryKey: ['match', matchId],
        queryFn: () => matchesApi.getMatchById(matchId!),
        enabled: !!matchId,
    });

    const startMatchMutation = useMutation({
        mutationFn: () => matchesApi.startMatch(matchId!),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['match', matchId] }),
    });

    const completeMatchMutation = useMutation({
        mutationFn: () => matchesApi.completeMatch(matchId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['match', matchId] });
            alert("Victory Claimed! Winnings have been added to your wallet.");
        },
    });

    const handleCopyCode = () => {
        if (match?.room_code) {
            navigator.clipboard.writeText(match.room_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoading) return <div className="flex items-center justify-center min-h-[400px] text-gray-400">Loading match details...</div>;
    if (error || !match) return <div className="text-center py-12 text-red-400">Match not found or error loading data.</div>;

    const isHost = match.created_by === user?.id;
    const isPlayer = match.created_by === user?.id || match.accepted_by === user?.id;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/app/matches')} className="text-gray-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            {match.match_type.replace('_', ' ')}
                            <Badge variant="outline" className="border-primary/30 text-primary uppercase text-[10px]">
                                {match.status}
                            </Badge>
                        </h1>
                        <p className="text-sm text-gray-400">Match ID: {match.id.slice(0, 8)}...</p>
                    </div>
                </div>

                {match.status === 'CREATED' && match.room_code && (
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                        <div className="text-xs text-gray-500 font-medium">ROOM CODE:</div>
                        <div className="text-lg font-mono font-black text-secondary tracking-widest">{match.room_code}</div>
                        <Button variant="ghost" size="icon" onClick={handleCopyCode} className="h-8 w-8 text-gray-400 hover:text-white">
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info & AI */}
                <div className="lg:col-span-1 space-y-8">
                    <Card className="bg-gray-900 border-white/10 overflow-hidden">
                        <CardHeader className="bg-white/5 border-b border-white/10 py-4">
                            <CardTitle className="text-sm uppercase tracking-tighter text-gray-400 flex items-center gap-2">
                                <Swords className="h-4 w-4" /> Match Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/5">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-500 uppercase font-black">Total Pot</p>
                                    <p className="text-2xl font-black text-secondary">${(match.total_pot_cents / 100).toFixed(2)}</p>
                                </div>
                                <Trophy className="h-8 w-8 text-accent opacity-20" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase mb-1">Platform</p>
                                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                                        {match.platform === 'MOBILE' ? <Smartphone className="h-4 w-4 text-purple-400" /> : <Monitor className="h-4 w-4 text-blue-400" />}
                                        {match.platform}
                                    </div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase mb-1">Game Mode</p>
                                    <div className="text-sm font-bold text-white">BO{match.best_of}</div>
                                </div>
                            </div>

                            {match.rules && (
                                <div className="space-y-2">
                                    <p className="text-[10px] text-gray-500 uppercase font-black">Match Rules</p>
                                    <div className="p-3 bg-white/5 rounded-lg text-xs text-gray-300 italic border border-white/5">
                                        "{match.rules}"
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-3 pt-4">
                                {match.status === 'ACCEPTED' && isHost && (
                                    <Button
                                        className="w-full bg-secondary hover:bg-secondary/90 text-dark font-black"
                                        onClick={() => startMatchMutation.mutate()}
                                        disabled={startMatchMutation.isPending}
                                    >
                                        <Play className="h-4 w-4 mr-2" /> START MATCH
                                    </Button>
                                )}
                                {match.status === 'IN_PROGRESS' && isPlayer && (
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-black"
                                        onClick={() => completeMatchMutation.mutate()}
                                        disabled={completeMatchMutation.isPending}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" /> I WON - SETTLE
                                    </Button>
                                )}

                                {isPlayer && match.status !== 'COMPLETED' && (
                                    <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/10 mt-6">
                                        <div className="flex items-center gap-2 text-red-400 mb-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-[10px] font-bold">PENALTY WARNING</span>
                                        </div>
                                        <p className="text-[9px] text-red-300/60 leading-relaxed">
                                            Leaving early will result in loss of Reputation, Rank (XP), and potential forfeit of stake funds.
                                            A 5-minute grace period applies for technical disconnects.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Win Estimator */}
                    <WinProbabilityEstimator
                        playerA={{ name: 'Self', username: user?.user_metadata?.username || 'You', winRate: 0.65, matches: 42 }}
                        playerB={{ name: 'Opponent', username: match.profiles?.username || 'Opponent', winRate: 0.58, matches: 38 }}
                    />
                </div>

                {/* Right Column: Chat & Social */}
                <div className="lg:col-span-2 space-y-8">
                    <MatchMessaging
                        matchId={matchId!}
                        isPlayer={isPlayer}
                        spectatorChatEnabled={match.spectator_chat_enabled}
                    />

                    {/* Spectators Info (Placeholder) */}
                    <div className="bg-white/5 rounded-xl border border-white/10 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-gray-400">12 Spectators Watching Live</span>
                        </div>
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <Avatar key={i} className="h-6 w-6 border-2 border-gray-900">
                                    <AvatarFallback className="bg-gray-800 text-[8px]">{i}</AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
