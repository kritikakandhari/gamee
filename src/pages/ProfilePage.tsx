import { useState, useEffect } from 'react'
import { Activity, ShieldCheck, Trophy, Target as TargetIcon, Brain as BrainIcon, Lock } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/auth/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [mfaData, setMfaData] = useState<{ id: string, qr_code: string, secret: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);

  const fetchMfaFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setMfaFactors(data.all || []);
    } catch (err) {
      console.error('Error fetching MFA factors:', err);
    }
  };

  useEffect(() => {
    if (user) fetchMfaFactors();
  }, [user]);

  const handleEnrollMFA = async () => {
    try {
      setMfaError(null);
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'FGC Money Match',
        friendlyName: user?.email || 'FGC Player'
      });
      if (error) throw error;
      setMfaData({
        id: data.id,
        qr_code: data.totp.qr_code,
        secret: data.totp.secret
      });
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Enrollment failed');
    }
  };

  const handleVerifyEnrollment = async () => {
    if (!mfaData || !mfaCode) return;
    try {
      setIsVerifying(true);
      setMfaError(null);

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaData.id
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaData.id,
        challengeId: challengeData.id,
        code: mfaCode
      });
      if (verifyError) throw verifyError;

      setIsEnrollDialogOpen(false);
      setMfaData(null);
      setMfaCode('');
      fetchMfaFactors();
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUnenrollMFA = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      fetchMfaFactors();
    } catch (err) {
      console.error('Unenrollment error:', err);
    }
  };

  const is2FAEnabled = mfaFactors.some(f => f.status === 'verified');
  // const isPlayerVerified = user?.user_metadata?.is_verified === true;

  const getDisplayInitials = () => {
    const name = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.username || user?.email || 'Player';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getDisplayName = () => {
    return user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.username || user?.email?.split('@')[0] || t('app.profile.player');
  };

  return (
    <>
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
                <Button variant="outline" size="sm" className="w-full text-xs border-white/5 hover:bg-white/5">
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
                <BrainIcon className="h-3 w-3 text-primary" />
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
                <TargetIcon className="h-4 w-4 text-purple-500" /> Missions & Challenges
              </CardTitle>
              <Badge variant="outline" className="text-[10px] border-white/10">3 Daily Active</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
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
                <div className="space-y-4">
                  <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Authentication</h4>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                    <div>
                      <p className="text-xs font-bold text-white">Two-Factor Auth (2FA)</p>
                      <p className="text-[10px] text-gray-500">Secure your funds with TOTP</p>
                    </div>
                    <Badge
                      className={cn(
                        "text-[9px] cursor-pointer",
                        is2FAEnabled ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}
                      onClick={() => is2FAEnabled ? handleUnenrollMFA(mfaFactors[0].id) : setIsEnrollDialogOpen(true)}
                    >
                      {is2FAEnabled ? 'ENABLED' : 'DISABLED'}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full text-[10px] uppercase font-black text-gray-400 border border-white/5">Change Password</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2FA Enrollment Dialog */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-secondary" />
              Setup 2FA Authentication
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {!mfaData ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Protect your real money matches by adding an extra layer of security. We use TOTP.
                </p>
                <Button onClick={handleEnrollMFA} className="bg-secondary text-black font-bold h-10 px-8">
                  Generate QR Code
                </Button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-center p-4 bg-white rounded-xl">
                  <QRCodeSVG value={mfaData.qr_code} size={180} />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-400 uppercase font-black">Verification Code</Label>
                    <Input
                      placeholder="000000"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="bg-white/5 border-white/20 text-center text-xl font-mono tracking-widest h-12"
                    />
                  </div>
                  {mfaError && <p className="text-xs text-red-400 text-center">{mfaError}</p>}
                  <Button
                    onClick={handleVerifyEnrollment}
                    className="w-full bg-secondary text-black font-black"
                    disabled={mfaCode.length < 6 || isVerifying}
                  >
                    {isVerifying ? 'Verifying...' : 'Enable 2FA'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
