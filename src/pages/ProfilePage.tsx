import { useState, useEffect } from 'react'
import { Activity, ShieldCheck, Trophy, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/auth/AuthProvider'
import { supabase } from '@/lib/supabaseClient'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Profile Edit State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');

  // Connect Game State
  const [selectedGame, setSelectedGame] = useState('');
  const [gameId, setGameId] = useState('');
  const [platform, setPlatform] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Initialize form from user data
  useEffect(() => {
    if (user) {
      setDisplayName(
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.username ||
        ''
      );
      setEmail(user.email || '');
      setPhone(user.user_metadata?.phone || '');
      setDob(user.user_metadata?.dob || '');
    }
  }, [user, isDialogOpen]);

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      const payload: any = {
        data: {
          display_name: displayName,
          phone,
          dob
        }
      };

      // Only update email if changed, as it triggers a confirmation flow
      if (email !== user.email) {
        payload.email = email;
      }

      const { error } = await supabase.auth.updateUser(payload);

      if (error) throw error;

      setMessage({ type: 'success', text: t('app.profile.editDialog.success') });

      // Close dialog after a short delay on success
      setTimeout(() => {
        setIsDialogOpen(false);
        setMessage(null);
      }, 1500);

    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: t('app.profile.editDialog.error') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGame = async () => {
    if (!selectedGame || !gameId || !platform) return;

    try {
      setIsLoading(true);
      setMessage(null);

      const currentGames = user?.user_metadata?.games || [];
      const newGame = {
        game: selectedGame,
        gameId,
        platform,
        connectedAt: new Date().toISOString()
      };

      const { error } = await supabase.auth.updateUser({
        data: {
          games: [...currentGames, newGame]
        }
      });

      if (error) throw error;

      setMessage({ type: 'success', text: t('app.profile.connectDialog.success') });

      setTimeout(() => {
        setIsConnectDialogOpen(false);
        setMessage(null);
        setSelectedGame('');
        setGameId('');
        setPlatform('');
      }, 1500);

    } catch (error) {
      console.error('Error connecting game:', error);
      setMessage({ type: 'error', text: t('app.profile.editDialog.error') });
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayInitials = () => {
    const name = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.username || user?.email || 'Player';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getDisplayName = () => {
    return user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.username || user?.email?.split('@')[0] || t('app.profile.player');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16 border-2 border-purple-500/20">
            <AvatarImage src={user?.user_metadata?.avatar_url} className="object-cover" />
            <AvatarFallback className="bg-purple-600 text-white text-xl">{getDisplayInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-white">{getDisplayName()}</h1>
              <Badge className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/20">US</Badge>
              <Badge className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/20">{t('app.profile.verified')}</Badge>
            </div>
            <p className="text-sm text-gray-400">{user?.email}</p>
            {user?.user_metadata?.phone && (
              <p className="text-xs text-gray-500 mt-1">
                {user.user_metadata.phone}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">{t('app.profile.edit')}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border-white/10 max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('app.profile.editDialog.title')}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">

                {/* Display Name */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right text-gray-400">
                    {t('app.profile.editDialog.displayName')}
                  </Label>
                  <Input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="col-span-3 bg-white/5 border-white/10 text-white focus:ring-purple-500"
                  />
                </div>

                {/* Email */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right text-gray-400">
                    {t('app.profile.editDialog.email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="col-span-3 bg-white/5 border-white/10 text-white focus:ring-purple-500"
                  />
                </div>

                {/* Phone */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right text-gray-400">
                    {t('app.profile.editDialog.phone')}
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="col-span-3 bg-white/5 border-white/10 text-white focus:ring-purple-500"
                  />
                </div>

                {/* DOB */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dob" className="text-right text-gray-400">
                    {t('app.profile.editDialog.dob')}
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="col-span-3 bg-white/5 border-white/10 text-white focus:ring-purple-500 [color-scheme:dark]"
                  />
                </div>

                {message && (
                  <div className={`text-sm text-center ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {message.text}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-white/10 text-gray-400 hover:text-white hover:bg-white/10">
                  {t('app.profile.editDialog.cancel')}
                </Button>
                <Button onClick={handleUpdateProfile} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('app.profile.editDialog.saving')}
                    </>
                  ) : (
                    t('app.profile.editDialog.save')
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">{t('app.profile.connect')}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border-white/10">
              <DialogHeader>
                <DialogTitle>{t('app.profile.connectDialog.title')}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>{t('app.profile.connectDialog.game')}</Label>
                  <Select value={selectedGame} onValueChange={setSelectedGame}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder={t('app.profile.connectDialog.game')} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-white/10 text-white">
                      <SelectItem value="sf6">Street Fighter 6</SelectItem>
                      <SelectItem value="tekken8">Tekken 8</SelectItem>
                      <SelectItem value="mk1">Mortal Kombat 1</SelectItem>
                      <SelectItem value="ggst">Guilty Gear Strive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>{t('app.profile.connectDialog.platform')}</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder={t('app.profile.connectDialog.platform')} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-white/10 text-white">
                      <SelectItem value="cfn">Capcom Fighters Network</SelectItem>
                      <SelectItem value="steam">Steam</SelectItem>
                      <SelectItem value="psn">PlayStation Network</SelectItem>
                      <SelectItem value="xbox">Xbox Live</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>{t('app.profile.connectDialog.gameId')}</Label>
                  <Input
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                {message && (
                  <div className={`text-sm text-center ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {message.text}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)} className="border-white/10 text-gray-400 hover:text-white hover:bg-white/10">
                  {t('app.profile.editDialog.cancel')}
                </Button>
                <Button onClick={handleConnectGame} disabled={isLoading || !selectedGame || !platform || !gameId} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('app.profile.connectDialog.connecting')}
                    </>
                  ) : (
                    t('app.profile.connectDialog.connect')
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-gray-300">{t('app.leaderboard.table.rating')}</CardTitle>
            <Trophy className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-white">1500</CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-gray-300">{t('app.leaderboard.table.winRate')}</CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-white">52%</CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-gray-300">{t('app.profile.anticheat')}</CardTitle>
            <ShieldCheck className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-white">{t('app.profile.enabled')}</CardContent>
        </Card>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-base text-white">{t('app.profile.recentMatches')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-400">
          {t('app.profile.historyPlaceholder')}
        </CardContent>
      </Card>
    </div >
  )
}
