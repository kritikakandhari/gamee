import { useState } from 'react';
import { Clock, Plus, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
// import { api } from '@/lib/api';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createMatchOpen, setCreateMatchOpen] = useState(false);
  const [matchType, setMatchType] = useState('QUICK_DUEL');
  const [stakeCents, setStakeCents] = useState(0);
  const [bestOf, setBestOf] = useState(3);

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
    mutationFn: async (data: { match_type: string; stake_cents: number; best_of: number }) => {
      return await matchesApi.createMatch(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-matches'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setCreateMatchOpen(false);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-matches'] });
      // alert("Victory claimed! match completed."); // Optional: silent update is smoother
    },
    onError: (err) => {
      console.error("Failed to complete match", err);
      alert("Failed to claim victory. Ensure the match is in progress.");
    }
  });

  const handleCreateMatch = () => {
    if (!user) return;
    createMatchMutation.mutate({
      match_type: matchType,
      stake_cents: stakeCents,
      best_of: bestOf,
    });
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
      return `Direct Challenge`;
    }
    return `${match.match_type.replace('_', ' ')} - ${formatCurrency(match.stake_cents)}`;
  };

  const getMatchMeta = (match: Match) => {
    const parts = [`Best of ${match.best_of}`];
    if (match.status === 'COMPLETED' && match.winner_id === user?.id) {
      parts.push('Won');
    } else if (match.status === 'COMPLETED') {
      // If completed but not won by self, assume lost for now (draws not handled yet)
      parts.push('Lost');
    }
    // if (match.completed_at) {
    //   parts.push(formatDate(match.completed_at));
    // }
    return parts.join(' • ');
  };

  if (!user) {
    return <div className="text-center py-12 text-gray-400">Please log in to view your matches</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Matches</h1>
          <p className="text-sm text-gray-400">Create, accept and track your 1v1 matches.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={createMatchOpen} onOpenChange={setCreateMatchOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-pink-500 to-purple-600">
                <Plus className="h-4 w-4" />
                Create Match
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Create New Match</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Set up a new competitive match
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Match Type</Label>
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
                  <Label>Stake (USD)</Label>
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
                <div className="space-y-2">
                  <Label>Best of (must be odd)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="7"
                    value={bestOf}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= 7 && val % 2 === 1) {
                        setBestOf(val);
                      }
                    }}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <Button
                  onClick={handleCreateMatch}
                  disabled={createMatchMutation.isPending}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600"
                >
                  {createMatchMutation.isPending ? 'Creating...' : 'Create Match'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading matches...</div>
      ) : matches && matches.length > 0 ? (
        <div className="grid gap-4">
          {matches.map((match: Match) => (
            <Card key={match.id} className="bg-white/5 border-white/10">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base text-white">{getMatchTitle(match)}</CardTitle>
                  <Badge variant={getStatusBadge(match.status)}>
                    {getStatusIcon(match.status)}
                    <span className="ml-1">{match.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
                <CardDescription className="text-gray-400">{getMatchMeta(match)}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(match.created_at)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Anti-cheat enabled
                  </span>
                  <span className="text-purple-300">
                    Prize: {formatCurrency(match.total_pot_cents)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/app/matches/${match.id}`)}
                  >
                    View
                  </Button>
                  {match.status === 'ACCEPTED' && (
                    <Button
                      size="sm"
                      onClick={() => startMatchMutation.mutate(match.id)}
                      disabled={startMatchMutation.isPending}
                    >
                      Start
                    </Button>
                  )}
                  {match.status === 'IN_PROGRESS' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to claim victory? This will end the match and update rankings.")) {
                          completeMatchMutation.mutate(match.id);
                        }
                      }}
                    >
                      Claim Victory
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
            No matches yet. Create your first match to get started!
          </CardContent>
        </Card>
      )}
    </div>
  );
}
