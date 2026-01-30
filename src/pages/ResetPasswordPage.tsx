import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useLanguage } from '@/contexts/LanguageContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLayout } from '@/components/layout/PageLayout';

export default function ResetPasswordPage() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if we have a session (Supabase auto-logs in via the reset link)
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If no session, the link might be invalid or expired
                // But for "updateUser" to work to set a new password, we must be authenticated
                // The reset link from Supabase does this automatically.
                // If here without session, maybe redirect to login?
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            // Success - redirect to login or dashboard
            navigate('/login', { state: { message: t('auth.resetPassword.success') } });
        } catch (err) {
            const message = err instanceof Error ? err.message : t('auth.error');
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PageLayout>
            <div className="flex min-h-screen items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-8 shadow-2xl">
                        {/* Decorative elements */}
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pink-500/10 blur-3xl" />
                        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

                        <div className="relative z-10">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <h1 className="text-3xl font-bold tracking-tight text-white">{t('auth.resetPassword.title')}</h1>
                                <p className="mt-2 text-purple-200/80">{t('auth.resetPassword.desc')}</p>
                            </motion.div>

                            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="space-y-2"
                                >
                                    <Label htmlFor="password" className="text-purple-200/90">{t('auth.password.label')}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-white/5 border-white/20 text-white placeholder:text-purple-200/50 focus:border-pink-400/50 focus-visible:ring-pink-500/50"
                                        required
                                        minLength={6}
                                        placeholder="********"
                                    />
                                </motion.div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="rounded-md bg-red-500/10 p-3 text-sm text-red-400"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="pt-2"
                                >
                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/20 transition-all hover:shadow-pink-500/40"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? t('common.loading') : t('auth.resetPassword.button')}
                                    </Button>
                                </motion.div>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </PageLayout>
    );
}
