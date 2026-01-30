import { useEffect, useState } from 'react';
import { adminApi, type IntegrityLog } from '@/lib/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { ShieldAlert, CheckCircle, Ban, MessageSquare, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminDashboard() {
    const [logs, setLogs] = useState<IntegrityLog[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('integrity');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [logsData, ticketsData] = await Promise.all([
                adminApi.getIntegrityLogs(),
                adminApi.getSupportTickets()
            ]);
            setLogs(logsData || []);
            setTickets(ticketsData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleResolve = async (id: string, action: 'DISMISS' | 'BAN') => {
        if (confirm(`Are you sure you want to ${action} this user?`)) {
            await adminApi.resolveFlag(id, action);
            fetchData();
        }
    };

    const handleResolveTicket = async (id: string, status: string) => {
        await adminApi.resolveTicket(id, status);
        fetchData();
    };

    return (
        <PageLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="h-8 w-8 text-red-500" />
                        Staff Command Center
                    </h1>
                    <p className="text-gray-400">Manage site integrity, anti-cheat, and player support.</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white/5 border border-white/10 p-1">
                        <TabsTrigger value="integrity" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                            <ShieldAlert className="h-4 w-4 mr-2" /> Integrity Logs
                        </TabsTrigger>
                        <TabsTrigger value="tickets" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                            <MessageSquare className="h-4 w-4 mr-2" /> Support Tickets
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="integrity" className="mt-6">
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
                    </TabsContent>

                    <TabsContent value="tickets" className="mt-6">
                        <div className="grid gap-4">
                            {loading ? (
                                <div className="text-center text-gray-500">Loading tickets...</div>
                            ) : tickets.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                                    <MessageSquare className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium text-white">No Open Tickets</h3>
                                    <p className="text-gray-400">All players are happy for now.</p>
                                </div>
                            ) : (
                                tickets.map((ticket) => (
                                    <Card key={ticket.id} className="bg-white/5 border-white/10">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-blue-400 border-blue-400/30 uppercase text-[10px]">
                                                    {ticket.type}
                                                </Badge>
                                                <CardTitle className="text-base text-white">
                                                    {ticket.subject}
                                                </CardTitle>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Clock className="h-3 w-3" />
                                                {new Date(ticket.created_at).toLocaleString()}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="p-3 bg-black/40 rounded-lg border border-white/5 italic text-sm text-gray-300">
                                                    "{ticket.message}"
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] text-purple-400 font-bold">
                                                            {ticket.profiles?.username?.[0]?.toUpperCase()}
                                                        </div>
                                                        <span className="text-xs text-gray-400">Raised by <b className="text-white">{ticket.profiles?.username}</b></span>
                                                        <Badge className={
                                                            ticket.status === 'OPEN' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                ticket.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' :
                                                                    'bg-gray-500/20 text-gray-400'
                                                        }>
                                                            {ticket.status}
                                                        </Badge>
                                                    </div>
                                                    {ticket.status === 'OPEN' && (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="bg-blue-600 hover:bg-blue-700 h-8"
                                                                onClick={() => handleResolveTicket(ticket.id, 'RESOLVED')}
                                                            >
                                                                Resolve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 border-white/10"
                                                                onClick={() => handleResolveTicket(ticket.id, 'CLOSED')}
                                                            >
                                                                Close
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </PageLayout>
    );
}
