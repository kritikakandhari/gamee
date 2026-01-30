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

const GLOSSARY_DEFINITIONS: Record<string, string> = {
    "50-50": "A situation where the offensive player has two main options (like overhead or low) that the defender must guess between, usually leading to a high-damage combo if guessed wrong.",
    "abare": "A Japanese term meaning 'to violent' or 'rage'. It refers to attacking while maintaining a disadvantage, usually hoping to interrupt the opponent's pressure.",
    "advantage": "Frame advantage. The difference in recovery time between two characters after a move connects or is blocked. Positive advantage means you recover first.",
    "armor": "A property of a move that allows a character to absorb one or more hits from an opponent without being interrupted.",
    "bnb": "Bread and Butter. A combo that is reliable, relatively easy to perform, and provides good damage or positioning. It's your go-to combo.",
    "cancel": "Interrupting the animation of one move with another move, usually to create combos or make moves safer.",
    "charge": "A character archetype that requires holding a direction (usually back or down) for a short time before pressing an attack button to perform special moves.",
    "chip": "Damage taken when blocking special moves or super arts. Normal moves typically do not inflict chip damage.",
    "command-throw": "A special move that grabs the opponent differently than a normal throw. They usually cannot be tech'd (escaped) and have different properties.",
    "counter": "Hitting an opponent while they are in the startup or active frames of their own attack. usually awards bonus damage and frame advantage.",
    "cross-up": "An attack (usually a jump-in) that hits the opponent on their other side, forcing them to switch blocking direction."
};

export default function InsightsPage() {
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
                    title: "Matchup Analysis: Ryu vs Ken",
                    content: "Focus on punishing Ken's heavy dragon lash. Keep him at mid-range using fireballs to bait jump-ins, then anti-air with DP.",
                    tips: ["Watch for drive rush overheads", "Punish heavy DP on block", "Neutral jump fireballs"]
                });
            } else if (type === 'drills') {
                setResult({
                    title: "Anti-Air Reaction Drill",
                    content: "Set dummy to random jump attack. Practice reacting with light DP. Goal: 10 in a row without trading.",
                    difficulty: "Intermediate"
                });
            } else if (type === 'archetype') {
                setResult({
                    title: "Archetype: Shoto",
                    content: "Balanced toolkit with good fireballs and reliable anti-airs. Excels at controlling space and punishing mistakes.",
                    pros: ["Versatile", "Good Defense"],
                    cons: ["Predictable", "Honest"]
                });
            } else if (type === 'glossary') {
                // For glossary, we pull directly from our dictionary
                // We'll use the 'result' state just to reuse the display component logic, 
                // but normally this might be instant.
                // const termKey = (document.getElementById('glossary-select') as HTMLSelectElement)?.value || '50-50';
                // Mocking finding the value from a real select state would be better, but simplest way for now:
                // Actually, let's grab the value from a state we need to add, or just random/hardcode for this 'generate' pattern:
                // BUT better is to use a state for the selected glossary term.
                setResult({
                    title: "Definition",
                    content: "Select a term to define."
                });
            }
        }, 1500);
    };

    const handleDefine = (term: string) => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setResult({
                title: GLOSSARY_TERMS.find(t => t.value === term)?.label || "Term",
                content: GLOSSARY_DEFINITIONS[term] || "Definition not found."
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
                        Game Insights
                    </motion.h1>
                    <p className="text-gray-400 mt-2">
                        Level up your gameplay with AI-powered analysis tools.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white/5 border border-white/10 p-1 grid grid-cols-4 w-full">
                        <TabsTrigger value="matchup" className="data-[state=active]:bg-purple-600">
                            <Swords className="h-4 w-4 mr-2" /> Matchup
                        </TabsTrigger>
                        <TabsTrigger value="drills" className="data-[state=active]:bg-pink-600">
                            <Target className="h-4 w-4 mr-2" /> Drills
                        </TabsTrigger>
                        <TabsTrigger value="archetype" className="data-[state=active]:bg-blue-600">
                            <Lightbulb className="h-4 w-4 mr-2" /> Archetypes
                        </TabsTrigger>
                        <TabsTrigger value="glossary" className="data-[state=active]:bg-green-600">
                            <BookOpen className="h-4 w-4 mr-2" /> Glossary
                        </TabsTrigger>
                    </TabsList>

                    {/* MATCHUP STRATEGY TAB */}
                    <TabsContent value="matchup" className="mt-6 space-y-6">
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-yellow-400" />
                                    Matchup Strategy Advisor
                                </CardTitle>
                                <CardDescription>Get strategic advice for a 1v1 matchup.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Game</Label>
                                        <Select defaultValue="sf6">
                                            <SelectTrigger className="bg-black/20 border-white/10">
                                                <SelectValue placeholder="Select Game" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sf6">Street Fighter 6</SelectItem>
                                                <SelectItem value="t8">Tekken 8</SelectItem>
                                                <SelectItem value="ggst">Guilty Gear Strive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Your Character</Label>
                                        <Input placeholder="e.g. Ryu" className="bg-black/20 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Opponent's Character</Label>
                                        <Input placeholder="e.g. Ken" className="bg-black/20 border-white/10" />
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleGenerate('matchup')}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                                >
                                    {loading ? "Analyzing..." : "Get Strategy Advice"}
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
                                    Training Drill Suggestions
                                </CardTitle>
                                <CardDescription>Receive personalized training drills.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Game</Label>
                                        <Select defaultValue="sf6">
                                            <SelectTrigger className="bg-black/20 border-white/10">
                                                <SelectValue placeholder="Select Game" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sf6">Street Fighter 6</SelectItem>
                                                <SelectItem value="t8">Tekken 8</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label>Difficulty</Label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                                <input type="radio" name="diff" className="accent-pink-500" /> Beginner
                                            </label>
                                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                                <input type="radio" name="diff" className="accent-pink-500" defaultChecked /> Intermediate
                                            </label>
                                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                                <input type="radio" name="diff" className="accent-pink-500" /> Advanced
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleGenerate('drills')}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600"
                                >
                                    {loading ? "Generating..." : "Get Training Drills"}
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
                                    Character Archetype Analysis
                                </CardTitle>
                                <CardDescription>Understand common playstyles for any character.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Game</Label>
                                        <Select defaultValue="sf6">
                                            <SelectTrigger className="bg-black/20 border-white/10">
                                                <SelectValue placeholder="Select Game" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sf6">Street Fighter 6</SelectItem>
                                                <SelectItem value="t8">Tekken 8</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Character to Analyze</Label>
                                        <Input placeholder="Select character" className="bg-black/20 border-white/10" />
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleGenerate('archetype')}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
                                >
                                    {loading ? "Analyzing..." : "Get Archetype Analysis"}
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
                                    Fighting Game Glossary
                                </CardTitle>
                                <CardDescription>Master the terminology of the FGC.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Select a Term</Label>
                                    <Select onValueChange={handleDefine}>
                                        <SelectTrigger className="bg-black/20 border-white/10">
                                            <SelectValue placeholder="Select a common term..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {GLOSSARY_TERMS.map(term => (
                                                <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="p-4 bg-black/40 rounded-lg border border-white/5 min-h-[100px] flex items-center justify-center text-gray-400 text-sm">
                                    {result && activeTab === 'glossary' ? null : "Select a term above to see its definition."}
                                    {/* Result is handled by main result area, but we can also show placeholder here */}
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
                                    <h4 className="font-semibold text-purple-400">Key Tips:</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-400">
                                        {result.tips.map((tip: string, i: number) => (
                                            <li key={i}>{tip}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

            </div>
        </PageLayout>
    );
}
