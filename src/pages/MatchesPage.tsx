import { useState } from 'react';
import { Clock, Plus, ShieldCheck, CheckCircle, XCircle, BookOpen, Search, Monitor, Smartphone, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/AuthProvider';
import { matchesApi, type Match } from '@/lib/matches';


const getStatusBadge = (status: string): "default" | "secondary" | "outline" | "destructive" => {
  const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    CREATED: 'secondary',
    ACCEPTED: 'default',
    IN_PROGRESS: 'default',
    COMPLETED: 'default',
    CANCELLED: 'outline',
    DISPUTED: 'destructive',
  };
  return variants[status] || 'secondary';
};

const getStatusIcon = (status: string) => {
  if (status === 'COMPLETED') return <CheckCircle className="h-4 w-4" />;
  if (status === 'CANCELLED') return <XCircle className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
};

export default function MatchesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createMatchOpen, setCreateMatchOpen] = useState(false);
  const [searchRoomCode, setSearchRoomCode] = useState('');
  const [matchType, setMatchType] = useState('QUICK_DUEL');
  const [stakeCents, setStakeCents] = useState(0);
  const [bestOf, setBestOf] = useState(3);
  const [platform, setPlatform] = useState('PC');
  const [isPrivate, setIsPrivate] = useState(false);
  const [rules, setRules] = useState('');
  const [spectatorChatEnabled, setSpectatorChatEnabled] = useState(true);
  const [twitchStreamEnabled, setTwitchStreamEnabled] = useState(false);
  const [twitchChannel, setTwitchChannel] = useState('');

  // Join by room code mutation
  const joinByCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      return await matchesApi.joinByRoomCode(code);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-matches'] });
      setSearchRoomCode('');
      if (data?.match_id) {
        navigate(`/app/matches/${data.match_id}`);
      }
    },
    onError: (err: any) => {
      alert(err.message || "Failed to join match. Please check the code.");
    }
  });

  // Fetch suggested matches
  const { data: suggestedMatchesWrapper } = useQuery({
    queryKey: ['suggested-matches'],
    queryFn: () => matchesApi.getSuggestedMatches(),
    enabled: !!user,
  });
  const suggestedMatches = suggestedMatchesWrapper?.data;

  // Fetch user's matches
  const { data: matchesWrapper, isLoading } = useQuery({
    queryKey: ['my-matches'],
    queryFn: () => matchesApi.getUserMatches(user?.id || ''),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const matches = matchesWrapper?.data || [];

  // Create match mutation
  const createMatchMutation = useMutation({
    mutationFn: async (data: any) => {
      return await matchesApi.createMatch(data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-matches'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setCreateMatchOpen(false);
      if (data?.match_id) {
        navigate(`/app/matches/${data.match_id}`);
      }
    },
  });

  // Start match mutation
  const startMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      return await matchesApi.startMatch(matchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-matches'] });
    },
  });

  // Complete match mutation
  const completeMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      return await matchesApi.completeMatch(matchId);
    },
    onSuccess: (_, matchId: string) => {
      queryClient.invalidateQueries({ queryKey: ['my-matches'] });

      // Calculate display payout (95% of pot)
      const match = matches?.find(m => m.id === matchId);
      if (match) {
        const payout = (match.total_pot_cents * 0.95) / 100;
        alert(`🏆 VICTORY! $${payout.toFixed(2)} has been added to your wallet!`);
      } else {
        alert("🏆 VICTORY! Your winnings have been added to your wallet.");
      }
    },
    onError: (err: any) => {
      console.error("Failed to complete match", err);
      const errorMsg = err.message || "Ensure the match is in progress.";
      alert(`Failed to claim victory: ${errorMsg}`);
    }
  });

  const handleCreateMatch = () => {
    if (!user) return;
    createMatchMutation.mutate({
      match_type: matchType,
      stake_cents: stakeCents,
      best_of: bestOf,
      platform,
      is_private: isPrivate,
      rules,
      spectator_chat_enabled: spectatorChatEnabled,
      twitch_url: twitchStreamEnabled ? twitchChannel : undefined
    } as any);
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getMatchTitle = (match: Match) => {
    if (match.match_type === 'DIRECT_CHALLENGE') {
      // Logic for opponent name might need adjustment based on how we fetch profiles
      // For now, simple fallback
      return t('app.matches.card.directChallenge');
    }
    return `${match.match_type.replace('_', ' ')} - ${formatCurrency(match.stake_cents)}`;
  };

  const getMatchMeta = (match: Match) => {
    const parts = [`${t('app.matches.card.bestOf')} ${match.best_of}`];
    if (match.status === 'COMPLETED' && match.winner_id === user?.id) {
      parts.push(t('app.matches.card.won'));
    } else if (match.status === 'COMPLETED') {
      // If completed but not won by self, assume lost for now (draws not handled yet)
      parts.push(t('app.matches.card.lost'));
    }
    // if (match.completed_at) {
    //   parts.push(formatDate(match.completed_at));
    // }
    return parts.join(' • ');
  };

  if (!user) {
    return <div className="text-center py-12 text-gray-400">{t('app.matches.loginRequired')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{t('app.matches.title')}</h1>
          <p className="text-sm text-gray-400">Join lobbies, link Twitch streams, and report scores for instant payouts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.open('https://docs.google.com/document/d/1XpYy_0N0X0Y_0X0Y0X0Y0X0Y0X0Y0X0Y0X0Y0X0Y0/edit', '_blank')}>
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Guide</span>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Private Search</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Join Private Lobby</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Enter the 6-digit room code sent by your opponent.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Room Code</Label>
                  <Input
                    placeholder="E.g. AF42B9"
                    maxLength={6}
                    className="bg-white/5 border-white/20 text-center text-xl font-mono tracking-widest uppercase"
                    value={searchRoomCode}
                    onChange={(e) => setSearchRoomCode(e.target.value.toUpperCase())}
                  />
                </div>
                <Button
                  className="w-full bg-secondary hover:bg-secondary/90"
                  onClick={() => joinByCodeMutation.mutate(searchRoomCode)}
                  disabled={joinByCodeMutation.isPending || searchRoomCode.length < 6}
                >
                  {joinByCodeMutation.isPending ? 'Joining...' : 'Join Lobby'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={createMatchOpen} onOpenChange={setCreateMatchOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-pink-500 to-purple-600">
                <Plus className="h-4 w-4" />
                {t('app.discover.createMatch.button')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>{t('app.discover.createMatch.title')}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  {t('app.discover.createMatch.desc')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('app.discover.createMatch.type')}</Label>
                  <select
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white"
                  >
                    <option value="QUICK_DUEL">Quick Duel</option>
                    <option value="RANKED">Ranked Challenge</option>
                    <option value="DIRECT_CHALLENGE">Direct Challenge</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('app.discover.createMatch.stake')}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    step="0.01"
                    value={stakeCents / 100}
                    onChange={(e) => setStakeCents(Math.round(parseFloat(e.target.value) * 100))}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <div className="flex bg-white/5 rounded-md p-1 border border-white/20">
                      <button
                        onClick={() => setPlatform('PC')}
                        className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all", platform === 'PC' ? "bg-primary text-dark" : "text-gray-400 hover:text-white")}
                      >
                        <Monitor className="h-4 w-4" /> PC
                      </button>
                      <button
                        onClick={() => setPlatform('MOBILE')}
                        className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all", platform === 'MOBILE' ? "bg-primary text-dark" : "text-gray-400 hover:text-white")}
                      >
                        <Smartphone className="h-4 w-4" /> Mobile
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('app.discover.createMatch.bestOf')}</Label>
                    <select
                      value={bestOf}
                      onChange={(e) => setBestOf(parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white"
                    >
                      <option value="1">Best of 1</option>
                      <option value="3">Best of 3</option>
                      <option value="5">Best of 5</option>
                      <option value="7">Best of 7</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rules / Description</Label>
                  <textarea
                    placeholder="E.g. No items, Final Destination only..."
                    className="w-full h-20 bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white text-sm"
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-white/10 mt-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Private Lobby</Label>
                    <p className="text-[10px] text-gray-500">Only joinable via Room Code</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Spectator Chat</Label>
                    <p className="text-[10px] text-gray-500">Allow others to chat while watching</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={spectatorChatEnabled}
                    onChange={(e) => setSpectatorChatEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Broadcast to Twitch</Label>
                    <p className="text-[10px] text-gray-500">Display your live stream in the match lobby</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={twitchStreamEnabled}
                    onChange={(e) => setTwitchStreamEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>

                {twitchStreamEnabled && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label>Twitch Channel Name</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 text-sm">twitch.tv/</span>
                      <Input
                        placeholder="username"
                        value={twitchChannel}
                        onChange={(e) => setTwitchChannel(e.target.value)}
                        className="pl-20 bg-white/5 border-white/20 text-white"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCreateMatch}
                  disabled={createMatchMutation.isPending}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 font-bold"
                >
                  {createMatchMutation.isPending ? t('app.discover.createMatch.creating') : t('app.discover.createMatch.submit')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {suggestedMatches && suggestedMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-4 w-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Suggested for Your Rank</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedMatches.map((match: Match) => (
              <Card key={`suggested-${match.id}`} className="bg-primary/5 border-primary/20 border-dashed hover:bg-primary/10 transition-colors cursor-pointer group" onClick={() => navigate(`/app/matches/${match.id}`)}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5 text-accent">
                      <Star className="h-3 w-3 fill-accent" />
                      <span className="text-[10px] font-bold">{match.profiles?.reputation || 100} Rep</span>
                    </div>
                    <Badge variant="outline" className="text-[8px] bg-primary/10 border-primary/20 text-primary">ELITE CHOICE</Badge>
                  </div>
                  <CardTitle className="text-sm text-white">{getMatchTitle(match)}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span>Stakes: {formatCurrency(match.stake_cents)}</span>
                    <span className="text-primary group-hover:translate-x-1 transition-transform">MATCH NOW →</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="h-px bg-white/5 my-8" />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">{t('app.matches.loading')}</div>
      ) : matches && matches.length > 0 ? (
        <div className="grid gap-4">
          {matches.map((match: Match) => (
            <Card key={match.id} className="bg-white/5 border-white/10 hover:border-primary/20 transition-colors relative overflow-hidden group">
              {match.is_private && (
                <div className="absolute top-0 right-0 bg-accent text-dark text-[9px] font-black px-1.5 py-0.5 rounded-bl-md shadow-sm">
                  PRIVATE
                </div>
              )}
              <CardHeader className="space-y-1 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {match.platform === 'MOBILE' ? <Smartphone className="h-3.5 w-3.5 text-purple-400" /> : <Monitor className="h-3.5 w-3.5 text-blue-400" />}
                    <CardTitle className="text-base text-white">{getMatchTitle(match)}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadge(match.status)}>
                      {getStatusIcon(match.status)}
                      <span className="ml-1 text-[10px]">{match.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <CardDescription className="text-gray-400 text-xs">{getMatchMeta(match)}</CardDescription>
                  <div className="flex items-center gap-1 text-accent/80 group-hover:text-accent transition-colors">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-[10px] font-bold">{match.profiles?.reputation || 100} Rep</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(match.created_at)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t('app.matches.card.antiCheat')}
                  </span>
                  <span className="text-purple-300">
                    {t('app.matches.card.prize')} {formatCurrency(match.total_pot_cents)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/app/matches/${match.id}`)}
                  >
                    {t('app.matches.card.view')}
                  </Button>
                  {match.status === 'ACCEPTED' && (
                    <Button
                      size="sm"
                      onClick={() => startMatchMutation.mutate(match.id)}
                      disabled={startMatchMutation.isPending}
                    >
                      {t('app.matches.card.start')}
                    </Button>
                  )}
                  {match.status === 'IN_PROGRESS' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        if (confirm(t('app.matches.card.confirmVictory'))) {
                          completeMatchMutation.mutate(match.id);
                        }
                      }}
                    >
                      {t('app.matches.card.claimVictory')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="text-center py-12 text-gray-400">
            {t('app.matches.empty')}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
