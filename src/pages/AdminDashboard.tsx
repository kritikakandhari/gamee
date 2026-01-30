import { useEffect, useState } from 'react';
import { adminApi, type IntegrityLog } from '@/lib/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { ShieldAlert, CheckCircle, Ban } from 'lucide-react';

export default function AdminDashboard() {
    const [logs, setLogs] = useState<IntegrityLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await adminApi.getIntegrityLogs();
            setLogs(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleResolve = async (id: string, action: 'DISMISS' | 'BAN') => {
        if (confirm(`Are you sure you want to ${action} this user?`)) {
            await adminApi.resolveFlag(id, action);
            fetchLogs();
        }
    };

    return (
        <PageLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-red-500 flex items-center gap-2">
                        <ShieldAlert className="h-8 w-8" />
                        Integrity Command Center
                    </h1>
                    <p className="text-gray-400">Monitor anti-cheat flags and potential fraud.</p>
                </div>

                <div className="grid gap-4">
                    {loading ? (
                        <div className="text-center text-gray-500">Loading integrity logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-white">System Clean</h3>
                            <p className="text-gray-400">No anomalies detected.</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <Card key={log.id} className="bg-white/5 border-white/10">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="destructive" className="animate-pulse">
                                            {log.severity}
                                        </Badge>
                                        <CardTitle className="text-base text-white font-mono">
                                            {log.flag_reason}
                                        </CardTitle>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(log.created_at).toLocaleString()}
                                    </span>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-gray-300">
                                                User: <span className="font-bold text-blue-400">{log.profiles?.username || log.user_id}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 font-mono">
                                                Match ID: {log.match_id}
                                            </p>
                                            <pre className="mt-2 p-2 bg-black/40 rounded text-xs text-red-300 overflow-x-auto max-w-md">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        </div>

                                        <div className="flex gap-2">
                                            {log.status === 'PENDING' ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-green-500/50 hover:bg-green-500/10 text-green-400"
                                                        onClick={() => handleResolve(log.id, 'DISMISS')}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Safe
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleResolve(log.id, 'BAN')}
                                                    >
                                                        <Ban className="h-4 w-4 mr-1" />
                                                        Ban User
                                                    </Button>
                                                </>
                                            ) : (
                                                <Badge variant="outline" className={log.status === 'BANNED' ? 'text-red-500 border-red-500' : 'text-green-500 border-green-500'}>
                                                    {log.status}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </PageLayout>
    );
}
