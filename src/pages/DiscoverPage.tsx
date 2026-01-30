import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Swords, Trophy, Zap, Users, Clock, Plus, Play, ShieldAlert } from 'lucide-react';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PageLayout } from '@/components/layout/PageLayout';
// import { api } from '@/lib/api'; // user: Removed axios api
import { useAuth } from '@/auth/AuthProvider';
import { matchesApi } from '@/lib/matches';

const stats = [
  { name: 'Active Players', value: '2,543', icon: Users, change: '+12%', changeType: 'positive' },
  { name: 'Matches Today', value: '1,287', icon: Swords, change: '+8%', changeType: 'positive' },
  { name: 'Avg. Queue Time', value: '23s', icon: Clock, change: '-5%', changeType: 'negative' },
  { name: 'Win Rate', value: '64%', icon: Trophy, change: '+2%', changeType: 'positive' },
];

export default function DiscoverPage() {
  const { isRestricted } = useGeoLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [createMatchOpen, setCreateMatchOpen] = useState(false);
  // Filters (Lobby)
  const [filterGame, setFilterGame] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterRank, setFilterRank] = useState('all');
  const [minReputation, setMinReputation] = useState([80]);
  const [stakeMin, setStakeMin] = useState('');
  const [stakeMax, setStakeMax] = useState('');

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

            {isRestricted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-200"
              >
                <ShieldAlert className="h-5 w-5 text-red-400" />
                <span className="text-sm">
                  <span className="font-bold">Region Restricted:</span> Paid matches are not available in your current location.
                </span>
              </motion.div>
            )}

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
                  placeholder="Search by player or lobby rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* LOBBY FILTERS ROW */}
              {/* LOBBY FILTERS ROW */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full mt-4">
                <Select value={filterGame} onValueChange={setFilterGame}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-gray-300">
                    <SelectValue placeholder="All Games" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    <SelectItem value="SF6">Street Fighter 6</SelectItem>
                    <SelectItem value="T8">Tekken 8</SelectItem>
                    <SelectItem value="MK1">Mortal Kombat 1</SelectItem>
                    <SelectItem value="GGS">Guilty Gear Strive</SelectItem>
                    <SelectItem value="DBFZ">Dragon Ball FighterZ</SelectItem>
                    <SelectItem value="GBVSR">Granblue Fantasy Versus: Rising</SelectItem>
                    <SelectItem value="UNI2">Under Night In-Birth II</SelectItem>
                    <SelectItem value="BBCF">BlazBlue Centralfiction</SelectItem>
                    <SelectItem value="CVS2">Capcom vs. SNK 2</SelectItem>
                    <SelectItem value="FFCOTW">Fatal Fury: CotW</SelectItem>
                    <SelectItem value="KI">Killer Instinct</SelectItem>
                    <SelectItem value="MVC2">Marvel vs. Capcom 2</SelectItem>
                    <SelectItem value="SC6">SoulCalibur VI</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterRegion} onValueChange={setFilterRegion}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-gray-300">
                    <SelectValue placeholder="Any Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Region</SelectItem>
                    <SelectItem value="NA">North America</SelectItem>
                    <SelectItem value="EU">Europe</SelectItem>
                    <SelectItem value="ASIA">Asia</SelectItem>
                    <SelectItem value="OCE">Oceania</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-gray-300">
                    <SelectValue placeholder="All Platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="PC">PC</SelectItem>
                    <SelectItem value="PS5">PlayStation 5</SelectItem>
                    <SelectItem value="XBOX">Xbox Series X|S</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterRank} onValueChange={setFilterRank}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-gray-300">
                    <SelectValue placeholder="All Ranks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ranks</SelectItem>
                    <SelectItem value="pro">Pro Contender</SelectItem>
                    <SelectItem value="new">New Challenger</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={createMatchOpen} onOpenChange={setCreateMatchOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={isRestricted}
                    className="h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/20 transition-all hover:shadow-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        {/* Header: Game & Status */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                            {/* Mock Game Name based on type for visual */}
                            {match.match_type.includes('SF6') ? 'Street Fighter 6' : 'Tekken 8'}
                          </h3>
                          <div className="flex gap-2">
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">Open</Badge>
                            <Badge variant="outline" className="border-white/20 text-gray-400">Public</Badge>
                          </div>
                        </div>

                        {/* Player Info - Mocked for UI match */}
                        <div className="space-y-2 mb-6">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span className="text-gray-500">Challenger:</span>
                            <span className="font-semibold text-white">Player_One</span>
                            <Badge variant="secondary" className="text-[10px] h-5 bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Top 500</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span className="text-gray-500">Reputation:</span>
                            <span className="text-green-400 font-mono">100%</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span className="text-gray-500">Platform:</span>
                            <span className="text-white">PC</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span className="text-gray-500">Posted:</span>
                            <span className="text-gray-400">Today</span>
                          </div>
                        </div>

                        {/* Stakes & Action */}
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5 mt-auto">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm text-purple-200/70">Stake</span>
                            <span className="text-xl font-bold text-white">{formatCurrency(match.stake_cents)}</span>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-purple-200/70">Payout</span>
                            <span className="text-lg font-mono text-green-400">~{formatCurrency(match.stake_cents * 1.8)}</span>
                          </div>

                          <Button
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold"
                            onClick={() => handleAcceptMatch(match.id)}
                            disabled={acceptMatchMutation.isPending}
                          >
                            <Swords className="mr-2 h-4 w-4" />
                            {acceptMatchMutation.isPending ? 'Joining...' : 'Fight Now'}
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


    </PageLayout>
  );
}
