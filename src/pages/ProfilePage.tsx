// import { useState, useEffect } from 'react'
import { /* useState, useEffect */ } from 'react'
import { Activity, ShieldCheck, Trophy, CheckCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/auth/AuthProvider'
import { supabase } from '@/lib/supabaseClient'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
/*
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
*/

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  /*
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
  */

  const getDisplayInitials = () => {
    const name = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.username || user?.email || 'Player';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getDisplayName = () => {
    return user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.username || user?.email?.split('@')[0] || t('app.profile.player');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Left Column: Profile Card & Customization */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="bg-gray-900 border-white/10 overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-indigo-600" />
          <CardContent className="pt-8 text-center">
            <div className="relative inline-block mb-4">
              {/* Item Border Preview (Placeholder) */}
              <div className="absolute -inset-2 border-2 border-accent/40 rounded-full animate-pulse opacity-50" />
              <Avatar className="h-24 w-24 border-2 border-white/10">
                <AvatarImage src={user?.user_metadata?.avatar_url} className="object-cover" />
                <AvatarFallback className="bg-purple-600 text-white text-3xl font-black">{getDisplayInitials()}</AvatarFallback>
              </Avatar>
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">
              {getDisplayName()}
            </h2>
            <p className="text-[10px] text-accent font-black uppercase tracking-[0.2em] mt-1">
              Pro Challenger • Rank 12
            </p>

            <div className="mt-6 space-y-2">
              <Button variant="outline" size="sm" className="w-full text-xs border-white/5 hover:bg-white/5" /* onClick={() => setIsDialogOpen(true)} */>
                Edit Profile
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-[10px] text-gray-500 uppercase font-black tracking-widest hover:text-white">
                Customization Menu
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reputation & Engagement Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center">
            <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Reputation</p>
            <p className="text-xl font-black text-green-400">98/100</p>
          </div>
          <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center">
            <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Career XP</p>
            <p className="text-xl font-black text-primary">12,450</p>
          </div>
        </div>
      </div>

      {/* Right Column: Missions & Activity */}
      <div className="lg:col-span-3 space-y-6">
        {/* Top Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-black/40 border-white/5 backdrop-blur-md">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total Stake Won</CardTitle>
              <Trophy className="h-3 w-3 text-accent" />
            </CardHeader>
            <CardContent className="py-2 px-4 text-2xl font-black text-white">$1,250.00</CardContent>
          </Card>
          <Card className="bg-black/40 border-white/5 backdrop-blur-md">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Match Record</CardTitle>
              <Activity className="h-3 w-3 text-green-400" />
            </CardHeader>
            <CardContent className="py-2 px-4 text-2xl font-black text-white">42 - 12</CardContent>
          </Card>
          <Card className="bg-black/40 border-white/5 backdrop-blur-md">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Insight Credits</CardTitle>
              <Brain className="h-3 w-3 text-primary" />
            </CardHeader>
            <CardContent className="py-2 px-4 text-2xl font-black text-primary">240</CardContent>
          </Card>
          <Card className="bg-black/40 border-white/5 backdrop-blur-md">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Global Rank</CardTitle>
              <ShieldCheck className="h-3 w-3 text-secondary" />
            </CardHeader>
            <CardContent className="py-2 px-4 text-2xl font-black text-white">#542</CardContent>
          </Card>
        </div>

        {/* Missions Section */}
        <Card className="bg-gray-900 border-white/10 overflow-hidden">
          <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between bg-white/5 py-4">
            <CardTitle className="text-sm font-black text-white flex items-center gap-2 uppercase italic tracking-tighter">
              <Target className="h-4 w-4 text-purple-500" /> Missions & Challenges
            </CardTitle>
            <Badge variant="outline" className="text-[10px] border-white/10">3 Daily Active</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {/* Daily Mission */}
              <div className="p-4 flex items-center justify-between group hover:bg-white/5 transition-all">
                <div className="flex gap-4 items-center">
                  <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-tight">Match Maker</p>
                    <p className="text-[10px] text-gray-500">Complete 3 money match challenges</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-accent mb-1 uppercase tracking-widest">1 / 3 PROG</div>
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[9px]">+10 Rank Pts</Badge>
                </div>
              </div>

              {/* Weekly Mission */}
              <div className="p-4 flex items-center justify-between group hover:bg-white/5 transition-all">
                <div className="flex gap-4 items-center">
                  <div className="h-10 w-10 rounded-xl bg-amber-600/20 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-tight">High Roller</p>
                    <p className="text-[10px] text-gray-500">Win a match with stakes over $50</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-gray-600 mb-1 uppercase tracking-widest">0 / 1 PROG</div>
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px]">+100 Credits</Badge>
                </div>
              </div>

              {/* Career Mission */}
              <div className="p-4 flex items-center justify-between group hover:bg-white/5 transition-all">
                <div className="flex gap-4 items-center">
                  <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-tight">Veteran Pro</p>
                    <p className="text-[10px] text-gray-500">Achieve Gold Tier rank or higher</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-gray-600 mb-1 uppercase tracking-widest">BRONZE II</div>
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px]">Exclusive Border</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Security & Finance */}
        <Card className="bg-gray-900 border-white/10 overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <CardTitle className="text-sm font-black text-white uppercase flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-secondary" /> Account Security & Finance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Security */}
              <div className="space-y-4">
                <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Authentication</h4>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">Two-Factor Auth (2FA)</p>
                    <p className="text-[10px] text-gray-500">Secure your funds with TOTP</p>
                  </div>
                  <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[9px] cursor-pointer">DISABLED</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">Email Verification</p>
                    <p className="text-[10px] text-green-400">Verified on 2024-01-15</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <Button variant="ghost" size="sm" className="w-full text-[10px] uppercase font-black text-gray-400 border border-white/5">Change Password</Button>

                <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest pt-2">Linked Accounts</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-white/5 border-white/10 hover:bg-[#9146FF]/20 hover:text-[#9146FF] hover:border-[#9146FF]/50 transition-all" onClick={() => supabase.auth.signInWithOAuth({ provider: 'twitch', options: { redirectTo: window.location.href } })}>
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h2.995l5.571-5.571V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V2.143h13.714z" /></svg>
                    Twitch
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-white/5 border-white/10 hover:bg-[#5865F2]/20 hover:text-[#5865F2] hover:border-[#5865F2]/50 transition-all" onClick={() => supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: window.location.href } })}>
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1892.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.1023.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" /></svg>
                    Discord
                  </Button>
                </div>
              </div>

              {/* Finance */}
              <div className="space-y-4">
                <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Payout Settings</h4>
                <div className="p-3 bg-white/5 rounded-lg border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-8 bg-white/10 rounded flex items-center justify-center text-[8px] font-bold">VISA</div>
                      <p className="text-xs text-white">**** 4242</p>
                    </div>
                    <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-secondary uppercase font-black">Edit</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-8 bg-blue-600/20 rounded flex items-center justify-center text-[8px] font-bold text-blue-400">P</div>
                      <p className="text-xs text-white">payout@example.com</p>
                    </div>
                    <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-secondary uppercase font-black">Edit</Button>
                  </div>
                </div>
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-black text-[10px] uppercase font-black">Link New Payment Method</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-black text-gray-500 uppercase tracking-widest">Performance Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-40 flex items-end gap-2 pb-6 px-6">
              {[30, 45, 25, 60, 80, 50, 90].map((h, i) => (
                <div key={i} className="flex-1 bg-primary/20 hover:bg-primary/40 transition-all rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-black text-gray-500 uppercase tracking-widest">Platform Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 uppercase font-black tracking-tighter italic">Desktop (PC)</span>
                <span className="text-white font-bold">75%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[75%]" />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 uppercase font-black tracking-tighter italic">Console (PS5/Xbox)</span>
                <span className="text-white font-bold">25%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-[25%]" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div >
  )
}

const Target = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
);

const Brain = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z" /></svg>
);
