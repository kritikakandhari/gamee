import { Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

type LeaderboardEntry = {
  rank: number;
  user_id: string;
  username: string;
  display_name: string | null;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  win_streak: number;
  total_matches: number;
  win_rate: number;
};

type LeaderboardResponse = {
  data: LeaderboardEntry[];
  meta: {
    pagination: {
      cursor: string | null;
      has_more: boolean;
    };
  };
};

export default function LeaderboardPage() {
  const { data: leaderboardData, isLoading } = useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const response = await api.get('/rankings', {
        params: { limit: 100 }
      });
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStreakBadge = (streak: number) => {
    if (streak > 0) {
      return <Badge variant="outline" className="text-green-400 border-green-400/50">W{streak}</Badge>;
    }
    return <Badge variant="outline" className="text-gray-400">-</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Leaderboard</h1>
        <p className="text-sm text-gray-400">Top players ranked by ELO rating</p>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Trophy className="h-4 w-4" />
            Top Players
          </CardTitle>
          <Badge variant="secondary">Season 1</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Loading leaderboard...</div>
          ) : leaderboardData?.data && leaderboardData.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="py-3 pr-3 font-medium">Rank</th>
                    <th className="py-3 pr-3 font-medium">Player</th>
                    <th className="py-3 pr-3 font-medium">Rating</th>
                    <th className="py-3 pr-3 font-medium">W/L</th>
                    <th className="py-3 pr-3 font-medium">Win Rate</th>
                    <th className="py-3 pr-3 font-medium">Streak</th>
                    <th className="py-3 pr-3 font-medium">Matches</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.data.map((entry) => (
                    <tr key={entry.user_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-3 font-medium text-white">
                        #{entry.rank}
                        {entry.rank <= 3 && (
                          <Trophy className="inline-block ml-2 h-4 w-4 text-yellow-400" />
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">
                            {entry.display_name || entry.username}
                          </span>
                          <span className="text-xs text-gray-400">@{entry.username}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-white font-semibold">{entry.rating}</span>
                      </td>
                      <td className="py-3 pr-3 text-gray-300">
                        {entry.wins}W / {entry.losses}L
                        {entry.draws > 0 && ` / ${entry.draws}D`}
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`font-medium ${
                          entry.win_rate >= 60 ? 'text-green-400' :
                          entry.win_rate >= 50 ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}>
                          {entry.win_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        {getStreakBadge(entry.win_streak)}
                      </td>
                      <td className="py-3 pr-3 text-gray-400">
                        {entry.total_matches}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              No players on the leaderboard yet. Be the first!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
