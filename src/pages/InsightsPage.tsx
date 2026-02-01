import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Brain, Target, Swords, Zap, Lightbulb, BookOpen,
    Lock, Volume2, Info, ChevronRight, Sparkles, Wand2,
    Trophy
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/auth/AuthProvider';
import { cn } from '@/lib/utils';
import type { TranslationKey } from '@/lib/translations';

const GLOSSARY_TERMS = [
    { value: "50-50", label: "50/50" },
    { value: "abare", label: "Abare" },
    { value: "advantage", label: "Advantage" },
    { value: "armor", label: "Armor" },
    { value: "bnb", label: "Bread and Butter (BnB)" },
    { value: "cancel", label: "Cancel" },
    { value: "charge", label: "Charge Character" },
    { value: "chip", label: "Chip Damage" },
    { value: "command-throw", label: "Command Throw" },
    { value: "counter", label: "Counter Hit" },
    { value: "cross-up", label: "Cross-up" },
    { value: "frame-data", label: "Frame Data" },
    { value: "mix-up", label: "Mix-up" },
    { value: "okizeme", label: "Okizeme" },
    { value: "spacing", label: "Spacing" },
];

export default function InsightsPage() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('matchup');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Simulated Subscription Check
    const isPro = user?.user_metadata?.subscription_tier === 'pro' || user?.user_metadata?.subscription_tier === 'staff';

    const handleGenerate = (type: string) => {
        if (!isPro && type !== 'glossary') return;

        setLoading(true);
        setResult(null);

        // Simulated AI response delay
        setTimeout(() => {
            setLoading(false);
            if (type === 'matchup') {
                setResult({
                    title: "Advanced Matchup Strategy: Ryu vs Ken",
                    content: "In this classic shoto matchup, the key is controlling the fireball game. Ken's Dragon Lash can be punished on reaction with a standing light punch into a full combo. Keep him at mid-range to negate his rushdown potential.",
                    tips: [
                        "Use Fireballs to bait jump-ins, then DP.",
                        "Punish heavy Dragon Lash with standing jab.",
                        "Watch for random Jinrai kicks; block low then high."
                    ]
                });
            } else if (type === 'drills') {
                setResult({
                    title: "Anti-Air & Reaction Training",
                    content: "Set the dummy to alternating between jumping attacks and dash-ins. Use your character's primary anti-air (2HP or DP) for jumps and 5MP or 2MK for dashes.",
                    difficulty: "Intermediate",
                    goals: ["10 successful anti-airs in a row", "3 dash punishes into drive rush"]
                });
            } else if (type === 'archetype') {
                setResult({
                    title: "Archetype Analysis: Grappler (e.g., Zangief)",
                    content: "Grapplers rely on high-risk, high-reward grabs. They typically have high health and armor-breaking moves but suffer from slow movement and getting zoned out by projectiles.",
                    pros: ["Dominant at close range", "Huge comeback potential", "Psychological pressure"],
                    cons: ["Slow movement", "Weak to fireballs", "Large hitbox"]
                });
            } else if (type === 'optimal') {
                setResult({
                    title: "Optimal Character Recommendation",
                    content: "Based on your preference for aggressive play and fast movement, Cammy or Rashid are your best picks. They excel at 'shimmy' situations and maintaining pressure.",
                    reasons: ["High mobility", "Versatile offense", "Strong strike/throw mixups"]
                });
            } else if (type === 'strategy') {
                setResult({
                    title: "High-Level Character Strategy: Cammy",
                    content: "Utilize Hooligan Combination to bait reactions. Use standing MK as your primary poke in neutral. In the corner, maintain pressure with 2MP into Spiral Arrow on hit, or strike/throw on block.",
                    sections: [
                        { h: "Neutral Game", p: "Walk back and forth to bait whiffs, then punish with 5HP." },
                        { h: "Corner Pressure", p: "Use fake cross-overs to confuse the opponent's DP inputs." }
                    ]
                });
            }
        }, 1200);
    };

    const handleDefine = (term: string) => {
        setLoading(true);
        setResult(null);
        setTimeout(() => {
            setLoading(false);
            const key = `app.glossary.${term}` as TranslationKey;
            setResult({
                title: GLOSSARY_TERMS.find(t => t.value === term)?.label || "Term",
                content: t(key) || "Definition not found."
            });
        }, 400);
    };

    const handleReadAloud = () => {
        if (!result || !result.content) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(result.content);
        utterance.onend = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    const FeatureLock = () => (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 p-6 text-center">
            <div className="space-y-4 max-w-xs animate-in fade-in zoom-in-95 duration-300">
                <div className="mx-auto w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Lock className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">
                        {t('app.insights.locked.title')}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        {t('app.insights.locked.desc')}
                    </p>
                </div>
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase italic text-xs tracking-widest">
                    Upgrade to Pro Plan
                </Button>
            </div>
        </div>
    );

    return (
        <PageLayout>
            <div className="max-w-6xl mx-auto space-y-8 pb-12">
                {/* Header with Guide Button */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4"
                        >
                            <Sparkles className="h-3 w-3 text-purple-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Next-Gen AI Analysis</span>
                        </motion.div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                            <Brain className="h-10 w-10 text-purple-500" />
                            {t('app.insights.title')}
                        </h1>
                        <p className="text-gray-400 mt-2 max-w-xl">
                            {t('app.insights.subtitle')}
                        </p>
                    </div>
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest gap-2">
                        <Info className="h-4 w-4" />
                        {t('app.insights.guide')}
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
                        <TabsList className="bg-white/5 border border-white/10 p-1 flex w-max min-w-full">
                            <TabsTrigger value="glossary" className="data-[state=active]:bg-green-600 font-bold text-xs py-2 px-6">
                                <BookOpen className="h-4 w-4 mr-2" /> {t('app.insights.tabs.glossary')} (FREE)
                            </TabsTrigger>
                            <TabsTrigger value="matchup" className="data-[state=active]:bg-purple-600 font-bold text-xs py-2 px-6">
                                <Swords className="h-4 w-4 mr-2" /> {t('app.insights.tabs.matchup')}
                            </TabsTrigger>
                            <TabsTrigger value="archetype" className="data-[state=active]:bg-blue-600 font-bold text-xs py-2 px-6">
                                <Lightbulb className="h-4 w-4 mr-2" /> {t('app.insights.tabs.archetypes')}
                            </TabsTrigger>
                            <TabsTrigger value="optimal" className="data-[state=active]:bg-orange-600 font-bold text-xs py-2 px-6">
                                <Trophy className="h-4 w-4 mr-2" /> Optimal Character
                            </TabsTrigger>
                            <TabsTrigger value="drills" className="data-[state=active]:bg-pink-600 font-bold text-xs py-2 px-6">
                                <Target className="h-4 w-4 mr-2" /> {t('app.insights.tabs.drills')}
                            </TabsTrigger>
                            <TabsTrigger value="strategy" className="data-[state=active]:bg-indigo-600 font-bold text-xs py-2 px-6">
                                <Wand2 className="h-4 w-4 mr-2" /> Character Strategy
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="relative mt-8">
                        {/* GLOSSARY (FREE) */}
                        <TabsContent value="glossary" className="m-0 focus-visible:outline-none">
                            <Card className="bg-gray-900/50 border-white/10 backdrop-blur-xl">
                                <CardHeader>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                            <BookOpen className="h-4 w-4 text-green-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-white">
                                                {t('app.insights.glossary.title')}
                                            </CardTitle>
                                            <CardDescription className="text-xs text-gray-500 leading-none">FREE FOR ALL USERS</CardDescription>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400">{t('app.insights.glossary.desc')}</p>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Select Term</Label>
                                        <Select onValueChange={handleDefine}>
                                            <SelectTrigger className="bg-black/40 border-white/10 h-12">
                                                <SelectValue placeholder={t('app.insights.selectTermPlaceholder')} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-900 border-white/10 max-h-[300px]">
                                                {GLOSSARY_TERMS.map(term => (
                                                    <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-xl border border-white/5 min-h-[140px] flex items-center justify-center text-center text-gray-500 italic text-sm">
                                        {result && activeTab === 'glossary' ? (
                                            <div className="animate-in fade-in duration-500">
                                                <h4 className="text-white font-black uppercase text-xl mb-2">{result.title}</h4>
                                                <p className="text-gray-400 not-italic leading-relaxed">{result.content}</p>
                                            </div>
                                        ) : t('app.insights.glossary.instruction')}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* PREMIUM TABS */}
                        <div className="grid gap-8">
                            {['matchup', 'archetype', 'optimal', 'drills', 'strategy'].map((tab) => (
                                <TabsContent key={tab} value={tab} className="m-0 focus-visible:outline-none relative">
                                    {!isPro && <FeatureLock />}
                                    <Card className={cn(
                                        "bg-gray-900/50 border-white/10 backdrop-blur-xl",
                                        !isPro && "opacity-50 grayscale select-none"
                                    )}>
                                        <CardHeader>
                                            <CardTitle className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                                                {tab === 'matchup' && <Zap className="h-5 w-5 text-yellow-400" />}
                                                {tab === 'archetype' && <Lightbulb className="h-5 w-5 text-blue-400" />}
                                                {tab === 'optimal' && <Trophy className="h-5 w-5 text-orange-400" />}
                                                {tab === 'drills' && <Target className="h-5 w-5 text-pink-400" />}
                                                {tab === 'strategy' && <Wand2 className="h-5 w-5 text-indigo-400" />}
                                                {tab === 'matchup' ? t('app.insights.matchup.title') :
                                                    tab === 'archetype' ? t('app.insights.archetype.title') :
                                                        tab === 'optimal' ? 'Optimal Character Finder' :
                                                            tab === 'drills' ? t('app.insights.drills.title') : 'Advanced Personality Analysis'}
                                            </CardTitle>
                                            <CardDescription>
                                                {tab === 'matchup' ? t('app.insights.matchup.desc') :
                                                    tab === 'archetype' ? t('app.insights.archetype.desc') :
                                                        tab === 'optimal' ? 'Find the best fighter based on your execution profile and playstyle.' :
                                                            tab === 'drills' ? t('app.insights.drills.desc') : 'Deep dive into specialized character strategies and execution.'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Generic Form Builder for AI Prompts */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t('app.insights.game')}</Label>
                                                    <Select defaultValue="sf6" disabled={!isPro}>
                                                        <SelectTrigger className="bg-black/40 border-white/10 h-12">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-gray-900 border-white/10">
                                                            <SelectItem value="sf6">Street Fighter 6</SelectItem>
                                                            <SelectItem value="t8">Tekken 8</SelectItem>
                                                            <SelectItem value="ggst">Guilty Gear Strive</SelectItem>
                                                            <SelectItem value="dbfz">Dragon Ball FighterZ</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                                        {tab === 'matchup' ? t('app.insights.yourChar') :
                                                            tab === 'optimal' ? 'Favorite Game' : 'Character to Analyze'}
                                                    </Label>
                                                    <Input
                                                        placeholder="e.g. Ken, Ryu, Cammy..."
                                                        className="bg-black/40 border-white/10 h-12"
                                                        disabled={!isPro}
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleGenerate(tab)}
                                                disabled={loading || !isPro}
                                                className={cn(
                                                    "w-full h-12 font-black uppercase tracking-[0.2em] italic text-sm transition-all shadow-lg",
                                                    tab === 'matchup' && "bg-gradient-to-r from-purple-600 to-blue-600",
                                                    tab === 'archetype' && "bg-gradient-to-r from-blue-600 to-cyan-600",
                                                    tab === 'optimal' && "bg-gradient-to-r from-orange-600 to-red-600",
                                                    tab === 'drills' && "bg-gradient-to-r from-pink-600 to-purple-600",
                                                    tab === 'strategy' && "bg-gradient-to-r from-indigo-600 to-purple-600"
                                                )}
                                            >
                                                {loading ? <Sparkles className="h-5 w-5 animate-spin" /> :
                                                    tab === 'matchup' ? t('app.insights.getAdvice') :
                                                        tab === 'optimal' ? 'Search Optimal Fighter' :
                                                            tab === 'drills' ? t('app.insights.getDrills') : 'Generate Analysis'}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            ))}
                        </div>
                    </div>
                </Tabs>

                {/* RESULTS AREA */}
                <AnimatePresence mode="wait">
                    {result && activeTab !== 'glossary' && (
                        <motion.div
                            key={result.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            <div className="bg-gradient-to-br from-gray-800/80 to-black border border-white/10 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full" />

                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 text-purple-400 mb-2">
                                            <Wand2 className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">AI Output</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{result.title}</h3>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={handleReadAloud}
                                        className={cn(
                                            "rounded-full h-12 w-12 border border-white/10 hover:bg-white/10 transition-colors",
                                            isSpeaking && "bg-purple-500 text-white animate-pulse"
                                        )}
                                        title={t('app.insights.readAloud')}
                                    >
                                        <Volume2 className="h-6 w-6" />
                                    </Button>
                                </div>

                                <div className="prose prose-invert max-w-none">
                                    <p className="text-gray-300 leading-relaxed font-medium">
                                        {result.content}
                                    </p>
                                </div>

                                {result.tips && (
                                    <div className="grid md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/5">
                                        {result.tips.map((tip: string, i: number) => (
                                            <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <ChevronRight className="h-4 w-4 text-purple-500" />
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Key Tip {i + 1}</span>
                                                </div>
                                                <p className="text-sm text-gray-300 font-bold">{tip}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {result.pros && (
                                    <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-white/5">
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-green-500" /> Strengthening Factors
                                            </h4>
                                            <ul className="space-y-2">
                                                {result.pros.map((p: string, i: number) => (
                                                    <li key={i} className="text-sm text-gray-400 flex items-center gap-2 bg-green-500/5 p-2 rounded-lg border border-green-500/10">
                                                        <ChevronRight className="h-3 w-3 text-green-500" /> {p}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-red-500" /> Counter Opportunities
                                            </h4>
                                            <ul className="space-y-2">
                                                {result.cons.map((c: string, i: number) => (
                                                    <li key={i} className="text-sm text-gray-400 flex items-center gap-2 bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                                                        <ChevronRight className="h-3 w-3 text-red-500" /> {c}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {result.goals && (
                                    <div className="mt-8 pt-8 border-t border-white/5">
                                        <h4 className="text-xs font-black text-pink-400 uppercase tracking-widest mb-4">Training Milestones</h4>
                                        <div className="grid gap-3">
                                            {result.goals.map((goal: string, i: number) => (
                                                <div key={i} className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 group">
                                                    <div className="h-6 w-6 rounded-full border-2 border-pink-500/30 flex items-center justify-center text-[10px] font-black group-hover:bg-pink-500 group-hover:text-black transition-all">0{i + 1}</div>
                                                    <span className="text-sm text-gray-300 font-bold">{goal}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageLayout>
    );
}
