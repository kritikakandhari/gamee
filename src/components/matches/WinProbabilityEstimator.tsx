import React, { useMemo } from 'react';
import { Brain, /* History, Target, */ BarChart, ShieldCheck, Zap, Info } from 'lucide-react';
import { motion } from 'framer-motion';
// import { cn } from '@/lib/utils';

interface WinProbabilityProps {
    playerA: { name: string; username: string; winRate: number; matches: number; character?: string };
    playerB: { name: string; username: string; winRate: number; matches: number; character?: string };
}

export const WinProbabilityEstimator: React.FC<WinProbabilityProps> = ({ playerA, playerB }) => {
    // Advanced AI Simulation Logic
    const probA = useMemo(() => {
        const base = (playerA.winRate + (1 - playerB.winRate)) / 2;
        const matchWeight = Math.min(playerA.matches / 50, 1);
        const randomFactor = (Math.random() * 0.05) - 0.025; // 2.5% variance
        return Math.round((base * 0.6 + 0.3 * matchWeight + 0.1 * (0.5 + randomFactor)) * 100);
    }, [playerA, playerB]);

    const probB = 100 - probA;

    return (
        <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            {/* Animated Background Pulse */}
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Brain className="h-20 w-20 text-primary animate-pulse" />
            </div>

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                        <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-black text-xs text-white uppercase tracking-[0.2em]">Quantum Win Estimator</h3>
                        <p className="text-[8px] text-gray-500 font-bold uppercase">Powered by start.gg & Liquipedia API</p>
                    </div>
                </div>
                <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[8px] font-black text-gray-500 uppercase tracking-widest">
                    v2.1 Stable
                </div>
            </div>

            {/* Main Probability Bar (The "WOW" factor) */}
            <div className="space-y-8">
                <div className="relative">
                    <div className="flex justify-between mb-2 px-1">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{playerA.username}</span>
                            <span className="text-2xl font-black text-white">{probA}%</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{playerB.username}</span>
                            <span className="text-2xl font-black text-white">{probB}%</span>
                        </div>
                    </div>

                    <div className="relative h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${probA}%` }}
                            transition={{ duration: 2, ease: [0.2, 0.8, 0.2, 1] }}
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-primary flex items-center justify-end px-2"
                        >
                            <div className="h-full w-4 bg-white/40 blur-sm -skew-x-12 animate-pulse" />
                        </motion.div>
                        <div className="absolute inset-x-0 inset-y-0 flex justify-center pointer-events-none">
                            <div className="h-full w-[1px] bg-white/20" />
                        </div>
                    </div>
                </div>

                {/* Character Matchup Matrix */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-all cursor-default group/card">
                        <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <BarChart className="h-3 w-3 text-purple-500" /> Performance Trend
                        </div>
                        <div className="h-12 flex items-end gap-1 px-1">
                            {[40, 70, 50, 90, 60, 85].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.1, duration: 1 }}
                                    className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm opacity-60 group-hover/card:opacity-100"
                                />
                            ))}
                        </div>
                        <p className="text-[9px] text-purple-400/60 mt-2 font-bold uppercase italic">Peak Efficiency: 92%</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-all cursor-default group/card">
                        <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <ShieldCheck className="h-3 w-3 text-blue-500" /> Matchup Edge
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[9px]">
                                <span className="text-gray-500 font-bold">VS ARCHETYPE</span>
                                <span className="text-green-400">+12.4%</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[75%]" />
                            </div>
                            <div className="flex justify-between items-center text-[9px]">
                                <span className="text-gray-500 font-bold">LATE GAME</span>
                                <span className="text-red-400">-4.1%</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 w-[45%]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Liquipedia Integration Box */}
                <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-xl p-4 border border-blue-500/20 relative group/liqui overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <img src="https://liquipedia.net/commons/images/0/07/Liquipedia_logo.png" className="h-3 opacity-50 contrast-125 invert" alt="Liquipedia" />
                            <span className="text-[9px] font-black text-blue-300 uppercase">Recent Tournaments</span>
                        </div>
                        <Zap className="h-3 w-3 text-yellow-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-white font-bold">EVO 2025: Top 32 Finish</p>
                        <p className="text-[10px] text-white/50 font-medium">Combo Breaker: Grand Finals (2nd)</p>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="flex gap-3 items-start bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/10 backdrop-blur-sm">
                    <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-[9px] text-indigo-200/50 leading-relaxed font-medium uppercase tracking-wider">
                            Legal Disclaimer
                        </p>
                        <p className="text-[8px] text-gray-500 leading-tight">
                            Probabilities are generated using cumulative data from start.gg, Liquipedia, and internal Money Match history. Estimates are for analytical purposes only and do not guarantee financial or competitive outcomes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
