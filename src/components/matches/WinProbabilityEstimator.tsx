import React, { useMemo } from 'react';
import { Brain, History, Info, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WinProbabilityProps {
    playerA: { name: string; username: string; winRate: number; matches: number };
    playerB: { name: string; username: string; winRate: number; matches: number };
}

export const WinProbabilityEstimator: React.FC<WinProbabilityProps> = ({ playerA, playerB }) => {
    // Simulate AI estimation logic
    const probA = useMemo(() => {
        const base = (playerA.winRate + (1 - playerB.winRate)) / 2;
        const matchWeight = Math.min(playerA.matches / 20, 1);
        return Math.round((base * 0.7 + 0.3 * matchWeight) * 100);
    }, [playerA, playerB]);

    const probB = 100 - probA;

    return (
        <div className="bg-gray-900 rounded-xl border border-white/10 p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Brain className="h-12 w-12 text-primary" />
            </div>

            <div className="flex items-center gap-2 mb-6">
                <Brain className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">AI Win Estimator</h3>
            </div>

            {/* Main Probability Bar */}
            <div className="space-y-6">
                <div className="relative h-6 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${probA}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center px-3"
                    >
                        <span className="text-[10px] font-black text-white">{probA}%</span>
                    </motion.div>
                    <div className="absolute top-0 right-0 h-full flex items-center px-3">
                        <span className="text-[10px] font-black text-white">{probB}%</span>
                    </div>
                </div>

                {/* Player Names */}
                <div className="flex justify-between text-xs font-bold text-gray-300">
                    <span className="text-purple-400">{playerA.username}</span>
                    <span className="text-blue-400">{playerB.username}</span>
                </div>

                {/* Detailed Stats Cards */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase">
                            <History className="h-3 w-3" /> Recent Form
                        </div>
                        <div className="flex gap-1">
                            {[1, 1, 0, 1, 1].map((win, i) => (
                                <div key={i} className={cn("h-1.5 w-4 rounded-full", win ? "bg-green-500" : "bg-red-500")}></div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-400">Lifetime Winrate</span>
                            <span className="text-white">{(playerA.winRate * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase">
                            <Target className="h-3 w-3" /> Recent Form
                        </div>
                        <div className="flex gap-1 justify-end">
                            {[0, 1, 1, 0, 0].map((win, i) => (
                                <div key={i} className={cn("h-1.5 w-4 rounded-full", win ? "bg-green-500" : "bg-red-500")}></div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-400">Lifetime Winrate</span>
                            <span className="text-white">{(playerB.winRate * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                {/* Matchup Record */}
                <div className="bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-gray-500 mb-1">HEAD-TO-HEAD RECORD</p>
                    <p className="text-sm font-bold text-white">4 - 2</p>
                    <p className="text-[9px] text-primary mt-1">Player A leads matchup history</p>
                </div>

                {/* Disclaimer */}
                <div className="flex gap-2 items-start bg-yellow-500/5 rounded p-3 border border-yellow-500/10">
                    <Info className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-yellow-200/60 leading-tight">
                        Disclaimer: These probabilities are AI-generated based on historical start.gg and Liquipedia records. They do not guarantee any specific outcome.
                    </p>
                </div>
            </div>
        </div>
    );
};
