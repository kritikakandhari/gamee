import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Swords, Trophy, Zap, Users, Clock, Plus, Play } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PageLayout } from '@/components/layout/PageLayout';
// import { api } from '@/lib/api'; // user: Removed axios api
import { useAuth } from '@/auth/AuthProvider';
import { matchesApi, type Match } from '@/lib/matches';

const stats = [
  { name: 'Active Players', value: '2,543', icon: Users, change: '+12%', changeType: 'positive' },
  { name: 'Matches Today', value: '1,287', icon: Swords, change: '+8%', changeType: 'positive' },
  { name: 'Avg. Queue Time', value: '23s', icon: Clock, change: '-5%', changeType: 'negative' },
  { name: 'Win Rate', value: '64%', icon: Trophy, change: '+2%', changeType: 'positive' },
];

export default function DiscoverPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [createMatchOpen, setCreateMatchOpen] = useState(false);
  // Match form state
  const [matchType, setMatchType] = useState('QUICK_DUEL');
  const [stakeCents, setStakeCents] = useState(0); // Default to 0 / free for now or user input
  const [bestOf, setBestOf] = useState(3);

  // Fetch matches (Real Supabase Data)
  const { data: matchesWrapper, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches', 'CREATED'],
    queryFn: () => matchesApi.getOpenMatches(),
    refetchInterval: 5000,
  });

  const matches = matchesWrapper?.data || [];

  // Create match mutation
  const createMatchMutation = useMutation({
    mutationFn: async (data: { match_type: string; stake_cents: number; best_of: number }) => {
      return await matchesApi.createMatch(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setCreateMatchOpen(false);
    },
    onError: (err) => {
      console.error("Failed to create match", err);
      // @ts-ignore
      alert(`Failed to create match: ${err.message || 'Unknown error'}`);
    }
  });

  // Accept match mutation
  const acceptMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      return await matchesApi.acceptMatch(matchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['my-matches'] });
      // Redirect to My Matches page so they can see it
      // @ts-ignore
      window.location.href = '/app/matches';
    },
    onError: (err) => {
      console.error("Failed to accept match", err);
      alert("Failed to accept match. Make sure you are logged in.");
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

  const handleAcceptMatch = (matchId: string) => {
    if (!user) return;
    acceptMatchMutation.mutate(matchId);
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <PageLayout>
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-8 mb-8 backdrop-blur-sm border border-white/10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pink-500/10 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative z-10">
            <motion.h1
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Find Your Next Match
            </motion.h1>
            <motion.p
              className="mt-3 max-w-2xl text-lg text-purple-200/90"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Compete in skill-based matches, join tournaments, and climb the leaderboards.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-400" />
                <Input
                  className="h-12 bg-white/5 border-white/10 pl-10 text-white placeholder:text-purple-200/50 focus:border-pink-400/50 focus-visible:ring-pink-500/50"
                  placeholder="Search matches, players, formats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Dialog open={createMatchOpen} onOpenChange={setCreateMatchOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/20 transition-all hover:shadow-pink-500/40"
                    size="lg"
                  >
                    <Plus className="mr-2 h-4 w-4" />
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
            </motion.div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, statIdx) => (
            <motion.div
              key={stat.name}
              className="overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + (statIdx * 0.1) }}
            >
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <stat.icon className="h-5 w-5 text-purple-400" aria-hidden="true" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-200/70">{stat.name}</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                    <span
                      className={`ml-2 text-sm ${stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="open" className="w-full">
          <TabsList className="bg-white/5 backdrop-blur-sm border border-white/10">
            <TabsTrigger
              value="open"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-purple-600/20 data-[state=active]:text-white data-[state=active]:border-pink-500/50 flex items-center gap-2"
            >
              <Swords className="h-4 w-4" />
              Open Matches
            </TabsTrigger>
            <TabsTrigger
              value="featured"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-purple-600/20 data-[state=active]:text-white data-[state=active]:border-pink-500/50 flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Featured
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-6">
            {matchesLoading ? (
              <div className="text-center py-12 text-gray-400">Loading matches...</div>
            ) : matches && matches.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {matches
                  // .filter((m: Match) => m.created_by !== user?.id) // user: Show own matches for now
                  .map((match) => (
                    <motion.div
                      key={match.id}
                      className="group relative flex flex-col h-full overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-pink-500/30 transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -5 }}
                    >
                      <div className="relative flex flex-col h-full p-6">
                        <div className="flex items-center justify-between mb-4">
                          <Badge className="bg-gradient-to-r from-pink-500/80 to-purple-600/80 text-white border-0">
                            {match.match_type.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-purple-200/70">
                            {formatCurrency(match.stake_cents)} stake
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {match.match_type.replace('_', ' ')}
                        </h3>
                        <p className="text-sm text-purple-200/80 mb-4">
                          Best of {match.best_of} • Prize: {formatCurrency(match.total_pot_cents)}
                        </p>
                        <div className="mt-auto pt-4">
                          <Button
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                            onClick={() => handleAcceptMatch(match.id)}
                            disabled={acceptMatchMutation.isPending}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            {acceptMatchMutation.isPending ? 'Accepting...' : 'Accept Match'}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            ) : (
              <motion.div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-8 backdrop-blur-sm border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="relative z-10 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                    <Zap className="h-8 w-8 text-blue-400" />
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-white">No Open Matches</h2>
                  <p className="mt-2 text-blue-200/80">Be the first to create a match!</p>
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="featured" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <motion.div
                className="group relative flex flex-col h-full overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-pink-500/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
              >
                <div className="relative flex flex-col h-full p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Swords className="h-5 w-5 text-pink-400" />
                    <Badge className="bg-gradient-to-r from-pink-500/80 to-purple-600/80 text-white border-0">
                      Quick Duel
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">1v1 Quick Duel</h3>
                  <p className="text-sm text-purple-200/80 mb-4">
                    Best of 3. Fast queue. US servers.
                  </p>
                  <div className="mt-auto pt-4">
                    <Button
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                      onClick={() => {
                        setMatchType('QUICK_DUEL');
                        setCreateMatchOpen(true);
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Create Quick Match
                    </Button>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="group relative flex flex-col h-full overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-amber-500/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="relative flex flex-col h-full p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    <Badge className="bg-gradient-to-r from-amber-500/80 to-orange-600/80 text-white border-0">
                      Ranked
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Ranked Challenge</h3>
                  <p className="text-sm text-purple-200/80 mb-4">
                    Skill-matched 1v1 with rating impact.
                  </p>
                  <div className="mt-auto pt-4">
                    <Button
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                      onClick={() => {
                        setMatchType('RANKED');
                        setCreateMatchOpen(true);
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Create Ranked
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-12 p-4 border-t border-white/10 text-xs text-gray-500 font-mono">
        <p>Debug Info (v1.2):</p>
        <p>User ID: {user?.id || 'Not Logged In'}</p>
        <p>Supabase: {import.meta.env.VITE_SUPABASE_URL ? 'Defined' : 'Missing'}</p>
        <button
          onClick={async () => {
            try {
              alert('Testing connection...');
              const res = await matchesApi.getOpenMatches();
              alert(`Connection OK! Found ${res.data?.length} matches.`);
            } catch (e: any) {
              alert(`Connection Failed: ${e.message}`);
            }
          }}
          className="mt-2 text-pink-500 underline"
        >
          Test Connection
        </button>
      </div>
    </PageLayout>
  );
}
