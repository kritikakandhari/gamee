import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ShieldAlert, MapPin, Check, ChevronRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const EntryOverlay: React.FC = () => {
    const { setLanguage } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState(1); // 1: Language, 2: Age/Geo
    const [ageConfirmed, setAgeConfirmed] = useState(false);
    const [geoStatus, setGeoStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [location, setLocation] = useState<string | null>(null);

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'ja', name: '日本語' },
        { code: 'zh', name: '中文' },
        { code: 'pt', name: 'Português' },
    ];

    useEffect(() => {
        const hasVerified = localStorage.getItem('mm_verified_entry');
        if (!hasVerified) {
            setIsVisible(true);
        }
    }, []);

    const handleLanguageSelect = (code: string) => {
        setLanguage(code as any);
        setStep(2);
    };

    const requestGeo = () => {
        if (!navigator.geolocation) {
            setGeoStatus('error');
            return;
        }

        setGeoStatus('pending');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGeoStatus('success');
                setLocation(`${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
            },
            () => {
                setGeoStatus('error');
            }
        );
    };

    const handleProceed = () => {
        if (ageConfirmed && geoStatus === 'success') {
            localStorage.setItem('mm_verified_entry', 'true');
            setIsVisible(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md p-8 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 blur-[100px] rounded-full" />

                <div className="relative space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                            MONEY <span className="text-primary-foreground">MATCH</span>
                        </h2>
                        <div className="h-1 w-12 bg-primary mx-auto mt-2 rounded-full" />
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="language"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3 justify-center text-gray-400">
                                    <Globe className="h-5 w-5" />
                                    <span className="text-sm font-medium uppercase tracking-widest">Select Language</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleLanguageSelect(lang.code)}
                                            className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all text-sm font-bold text-white group"
                                        >
                                            {lang.name}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="verification"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    {/* Age Verification */}
                                    <div
                                        onClick={() => setAgeConfirmed(!ageConfirmed)}
                                        className={cn(
                                            "flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all",
                                            ageConfirmed ? "bg-primary/10 border-primary/40" : "bg-white/5 border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                            ageConfirmed ? "bg-primary border-primary text-black" : "border-white/20"
                                        )}>
                                            {ageConfirmed && <Check className="h-4 w-4 stroke-[3px]" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">Age Verification</p>
                                            <p className="text-xs text-gray-500">I am at least 18 years old.</p>
                                        </div>
                                        <ShieldAlert className={cn(
                                            "h-6 w-6 ml-auto",
                                            ageConfirmed ? "text-primary" : "text-gray-600"
                                        )} />
                                    </div>

                                    {/* Geolocation Verification */}
                                    <div
                                        className={cn(
                                            "flex items-center gap-4 p-5 rounded-2xl border transition-all",
                                            geoStatus === 'success' ? "bg-green-500/10 border-green-500/40" :
                                                geoStatus === 'error' ? "bg-red-500/10 border-red-500/40" : "bg-white/5 border-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center shadow-lg",
                                            geoStatus === 'success' ? "bg-green-500 text-black" :
                                                geoStatus === 'error' ? "bg-red-500 text-white" : "bg-white/10 text-gray-400"
                                        )}>
                                            <MapPin className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white">Security Check</p>
                                            <p className="text-xs text-gray-500">
                                                {geoStatus === 'success' ? `Location: ${location}` :
                                                    geoStatus === 'error' ? 'Location access required' :
                                                        'Confirming region...'}
                                            </p>
                                        </div>
                                        {geoStatus === 'pending' && (
                                            <Button size="sm" onClick={requestGeo} className="h-8 text-xs bg-primary hover:bg-primary/80 text-black">
                                                Verify
                                            </Button>
                                        )}
                                        {geoStatus === 'error' && (
                                            <AlertCircle onClick={requestGeo} className="h-5 w-5 text-red-500 cursor-pointer" />
                                        )}
                                    </div>
                                </div>

                                <Button
                                    disabled={!ageConfirmed || geoStatus !== 'success'}
                                    onClick={handleProceed}
                                    className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black text-lg rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.3)] group"
                                >
                                    PROCEED TO MONEY MATCH
                                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>

                                <p className="text-[10px] text-center text-gray-600 uppercase tracking-widest leading-relaxed">
                                    By proceeding, you agree to our Terms of Service and Privacy Policy. <br />
                                    Money Match prohibits gambling.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
