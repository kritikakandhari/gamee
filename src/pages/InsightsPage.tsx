import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Target, Swords, Zap, Lightbulb, BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
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
];

export default function InsightsPage() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('matchup');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Mock Generators
    const handleGenerate = (type: string) => {
        setLoading(true);
        setResult(null);
        setTimeout(() => {
            setLoading(false);
            if (type === 'matchup') {
                setResult({
                    title: t('app.insights.mock.matchup.title'),
                    content: t('app.insights.mock.matchup.content'),
                    tips: [
                        t('app.insights.mock.matchup.tip1'),
                        t('app.insights.mock.matchup.tip2'),
                        t('app.insights.mock.matchup.tip3')
                    ]
                });
            } else if (type === 'drills') {
                setResult({
                    title: t('app.insights.mock.drills.title'),
                    content: t('app.insights.mock.drills.content'),
                    difficulty: t('app.insights.diff.intermediate')
                });
            } else if (type === 'archetype') {
                setResult({
                    title: t('app.insights.mock.archetype.title'),
                    content: t('app.insights.mock.archetype.content'),
                    pros: [t('app.insights.mock.archetype.pro1'), t('app.insights.mock.archetype.pro2')],
                    cons: [t('app.insights.mock.archetype.con1'), t('app.insights.mock.archetype.con2')]
                });
            } else if (type === 'glossary') {
                setResult({
                    title: t('app.insights.glossary.title'),
                    content: t('app.insights.glossary.instruction')
                });
            }
        }, 1500);
    };

    const handleDefine = (term: string) => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            // Construct the key dynamically. 
            // We know our terms match the keys 'app.glossary.[term]'
            const key = `app.glossary.${term}` as TranslationKey;

            setResult({
                title: GLOSSARY_TERMS.find(t => t.value === term)?.label || "Term",
                content: t(key) || "Definition not found."
            });
        }, 500);
    };

    return (
        <PageLayout>
            <div className="space-y-8">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold text-white flex items-center gap-3"
                    >
                        <Brain className="h-8 w-8 text-purple-400" />
                        {t('app.insights.title')}
                    </motion.h1>
                    <p className="text-gray-400 mt-2">
                        {/* Level up your gameplay with AI-powered analysis tools. */}
                        {t('app.insights.subtitle')}
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white/5 border border-white/10 p-1 grid grid-cols-4 w-full">
                        <TabsTrigger value="matchup" className="data-[state=active]:bg-purple-600">
                            <Swords className="h-4 w-4 mr-2" /> {t('app.insights.tabs.matchup')}
                        </TabsTrigger>
                        <TabsTrigger value="drills" className="data-[state=active]:bg-pink-600">
                            <Target className="h-4 w-4 mr-2" /> {t('app.insights.tabs.drills')}
                        </TabsTrigger>
                        <TabsTrigger value="archetype" className="data-[state=active]:bg-blue-600">
                            <Lightbulb className="h-4 w-4 mr-2" /> {t('app.insights.tabs.archetypes')}
                        </TabsTrigger>
                        <TabsTrigger value="glossary" className="data-[state=active]:bg-green-600">
                            <BookOpen className="h-4 w-4 mr-2" /> {t('app.insights.tabs.glossary')}
                        </TabsTrigger>
                    </TabsList>

                    {/* MATCHUP STRATEGY TAB */}
                    <TabsContent value="matchup" className="mt-6 space-y-6">
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-yellow-400" />
                                    {t('app.insights.matchup.title')}
                                </CardTitle>
                                <CardDescription>{t('app.insights.matchup.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('app.insights.game')}</Label>
                                        <Select defaultValue="sf6">
                                            <SelectTrigger className="bg-black/20 border-white/10">
                                                <SelectValue placeholder={t('app.insights.selectGame')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sf6">Street Fighter 6</SelectItem>
                                                <SelectItem value="t8">Tekken 8</SelectItem>
                                                <SelectItem value="ggst">Guilty Gear Strive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('app.insights.yourChar')}</Label>
                                        <Input placeholder={t('app.insights.selectChar') || "e.g. Ryu"} className="bg-black/20 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('app.insights.opponentChar')}</Label>
                                        <Input placeholder={t('app.insights.selectChar') || "e.g. Ken"} className="bg-black/20 border-white/10" />
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleGenerate('matchup')}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                                >
                                    {loading ? t('app.insights.analyzing') : t('app.insights.getAdvice')}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TRAINING DRILLS TAB */}
                    <TabsContent value="drills" className="mt-6 space-y-6">
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-green-400" />
                                    {t('app.insights.drills.title')}
                                </CardTitle>
                                <CardDescription>{t('app.insights.drills.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('app.insights.game')}</Label>
                                        <Select defaultValue="sf6">
                                            <SelectTrigger className="bg-black/20 border-white/10">
                                                <SelectValue placeholder={t('app.insights.selectGame')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sf6">Street Fighter 6</SelectItem>
                                                <SelectItem value="t8">Tekken 8</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label>{t('app.insights.difficulty')}</Label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                                <input type="radio" name="diff" className="accent-pink-500" /> {t('app.insights.diff.beginner')}
                                            </label>
                                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                                <input type="radio" name="diff" className="accent-pink-500" defaultChecked /> {t('app.insights.diff.intermediate')}
                                            </label>
                                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                                <input type="radio" name="diff" className="accent-pink-500" /> {t('app.insights.diff.advanced')}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleGenerate('drills')}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600"
                                >
                                    {loading ? t('app.insights.generating') : t('app.insights.getDrills')}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ARCHETYPE ANALYSIS TAB */}
                    <TabsContent value="archetype" className="mt-6 space-y-6">
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-blue-400" />
                                    {t('app.insights.archetype.title')}
                                </CardTitle>
                                <CardDescription>{t('app.insights.archetype.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('app.insights.game')}</Label>
                                        <Select defaultValue="sf6">
                                            <SelectTrigger className="bg-black/20 border-white/10">
                                                <SelectValue placeholder={t('app.insights.selectGame')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sf6">Street Fighter 6</SelectItem>
                                                <SelectItem value="t8">Tekken 8</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('app.insights.charToAnalyze')}</Label>
                                        <Input placeholder={t('app.insights.selectChar')} className="bg-black/20 border-white/10" />
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleGenerate('archetype')}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
                                >
                                    {loading ? t('app.insights.analyzing') : t('app.insights.getArchetype')}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* GLOSSARY TAB */}
                    <TabsContent value="glossary" className="mt-6 space-y-6">
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-green-400" />
                                    {t('app.insights.glossary.title')}
                                </CardTitle>
                                <CardDescription>{t('app.insights.glossary.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('app.insights.selectTerm')}</Label>
                                    <Select onValueChange={handleDefine}>
                                        <SelectTrigger className="bg-black/20 border-white/10">
                                            <SelectValue placeholder={t('app.insights.selectTermPlaceholder')} />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {GLOSSARY_TERMS.map(term => (
                                                <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="p-4 bg-black/40 rounded-lg border border-white/5 min-h-[100px] flex items-center justify-center text-gray-400 text-sm">
                                    {result && activeTab === 'glossary' ? null : t('app.insights.glossary.instruction')}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* RESULTS AREA */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8"
                    >
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 p-6 rounded-xl shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-2">{result.title}</h3>
                            <p className="text-gray-300 mb-4">{result.content}</p>

                            {result.tips && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-purple-400">{t('app.insights.result.keyTips')}</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-400">
                                        {result.tips.map((tip: string, i: number) => (
                                            <li key={i}>{tip}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.pros && (
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <h4 className="font-semibold text-green-400 mb-1">Pros</h4>
                                        <ul className="list-disc list-inside text-sm text-gray-400">
                                            {result.pros.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-red-400 mb-1">Cons</h4>
                                        <ul className="list-disc list-inside text-sm text-gray-400">
                                            {result.cons.map((c: string, i: number) => <li key={i}>{c}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

            </div>
        </PageLayout>
    );
}
