import { Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
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
        <h1 className="text-xl font-semibold text-white">{t('app.leaderboard.title')}</h1>
        <p className="text-sm text-gray-400">{t('app.leaderboard.subtitle')}</p>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Trophy className="h-4 w-4" />
            {t('app.leaderboard.cardTitle')}
          </CardTitle>
          <Badge variant="secondary">{t('app.leaderboard.season')}</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">{t('app.leaderboard.loading')}</div>
          ) : leaderboardData?.data && leaderboardData.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="py-3 pr-3 font-medium">{t('app.leaderboard.table.rank')}</th>
                    <th className="py-3 pr-3 font-medium">{t('app.leaderboard.table.player')}</th>
                    <th className="py-3 pr-3 font-medium">{t('app.leaderboard.table.rating')}</th>
                    <th className="py-3 pr-3 font-medium">{t('app.leaderboard.table.wl')}</th>
                    <th className="py-3 pr-3 font-medium">{t('app.leaderboard.table.winRate')}</th>
                    <th className="py-3 pr-3 font-medium">{t('app.leaderboard.table.streak')}</th>
                    <th className="py-3 pr-3 font-medium">{t('app.leaderboard.table.matches')}</th>
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
                        <span className={`font-medium ${entry.win_rate >= 60 ? 'text-green-400' :
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
              {t('app.leaderboard.empty')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
