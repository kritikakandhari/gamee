import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageSquare, ToggleLeft, ToggleRight, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/AuthProvider';

interface Message {
    id: string;
    sender_id: string;
    sender_name: string;
    avatar_url?: string;
    text: string;
    timestamp: string;
    is_spectator: boolean;
    is_private: boolean; // True if only for opponent/challenger
}

interface MatchMessagingProps {
    matchId: string;
    isPlayer: boolean;
    spectatorChatEnabled: boolean;
}

export const MatchMessaging: React.FC<MatchMessagingProps> = ({ matchId, isPlayer, spectatorChatEnabled }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [showSpectatorChat, setShowSpectatorChat] = useState(true);
    const [chatMode, setChatMode] = useState<'MATCH' | 'PRIVATE'>(isPlayer ? 'PRIVATE' : 'MATCH');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Mock initial messages
    useEffect(() => {
        setMessages([
            {
                id: '1',
                sender_id: 'sys',
                sender_name: 'System',
                text: 'Wait for match to begin. Use Private tab for coordination.',
                timestamp: new Date().toISOString(),
                is_spectator: false,
                is_private: false
            },
            {
                id: '2',
                sender_id: 'm1',
                sender_name: 'SpectatorBot',
                avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bot',
                text: 'This is going to be a close one! 🍿',
                timestamp: new Date().toISOString(),
                is_spectator: true,
                is_private: false
            }
        ]);
    }, [matchId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, showSpectatorChat, chatMode]);

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            sender_id: user?.id || 'anon',
            sender_name: user?.user_metadata?.username || 'Guest',
            avatar_url: user?.user_metadata?.avatar_url,
            text: inputText,
            timestamp: new Date().toISOString(),
            is_spectator: !isPlayer,
            is_private: chatMode === 'PRIVATE'
        };

        setMessages([...messages, newMessage]);
        setInputText('');
    };

    const filteredMessages = messages.filter(msg => {
        // 1. If it's a private message, only show to players
        if (msg.is_private) {
            if (!isPlayer) return false; // Spectators NEVER see private
            return chatMode === 'PRIVATE'; // Only show if user is in PRIVATE tab
        }

        // 2. Room messages
        if (chatMode === 'PRIVATE') return false; // Don't show ROOM msg in PRIVATE tab

        // 3. Spectator filtering
        if (msg.is_spectator) {
            return spectatorChatEnabled && showSpectatorChat;
        }

        return true;
    });

    return (
        <div className="flex flex-col h-[600px] bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
            {/* Header / Tabs */}
            <div className="bg-gray-900/50 border-b border-white/10">
                <div className="flex p-1 gap-1">
                    <button
                        onClick={() => setChatMode('MATCH')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all",
                            chatMode === 'MATCH' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        <Users className="h-4 w-4" />
                        ROOM CHAT
                    </button>
                    {isPlayer && (
                        <button
                            onClick={() => setChatMode('PRIVATE')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all",
                                chatMode === 'PRIVATE' ? "bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            <Lock className="h-4 w-4" />
                            PRIVATE (OPPONENT)
                        </button>
                    )}
                </div>
            </div>

            {/* Utility Bar */}
            <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-3">
                    <span className="text-gray-500 uppercase tracking-widest flex items-center gap-1">
                        <Globe className="h-3 w-3" /> UI Lang:
                    </span>
                    <div className="flex gap-1.5">
                        {['EN', 'ES', 'JA', 'ZH'].map(l => (
                            <button key={l} className="text-gray-400 hover:text-white transition-colors">{l}</button>
                        ))}
                    </div>
                </div>

                {spectatorChatEnabled && chatMode === 'MATCH' && (
                    <button
                        onClick={() => setShowSpectatorChat(!showSpectatorChat)}
                        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
                    >
                        {showSpectatorChat ? 'Spectators ON' : 'Spectators OFF'}
                        {showSpectatorChat ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10"
            >
                {filteredMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
                        <MessageSquare className="h-8 w-8" />
                        <p className="text-xs uppercase tracking-widest">No messages yet</p>
                    </div>
                )}
                {filteredMessages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex gap-4 animate-in fade-in slide-in-from-bottom-3",
                            msg.sender_id === user?.id ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        <Avatar className="h-10 w-10 border-2 border-white/5 shrink-0 shadow-lg">
                            <AvatarImage src={msg.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-800 text-xs font-black text-white">
                                {msg.sender_name[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                            "flex flex-col",
                            msg.sender_id === user?.id ? "items-end" : "items-start"
                        )}>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{msg.sender_name}</span>
                                {msg.is_spectator && <Badge variant="outline" className="text-[8px] py-0 px-1 border-white/10 text-gray-500">SPECTATOR</Badge>}
                                <span className="text-[8px] text-gray-600">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={cn(
                                "px-4 py-3 rounded-2xl text-sm shadow-xl transition-all",
                                msg.sender_id === user?.id
                                    ? "bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-tr-none border border-white/10"
                                    : msg.is_private
                                        ? "bg-gradient-to-br from-amber-900/40 to-amber-900/20 text-amber-100 rounded-tl-none border border-amber-500/20"
                                        : "bg-white/5 text-gray-200 rounded-tl-none border border-white/10 hover:bg-white/10"
                            )}>
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-5 bg-gray-900/80 border-t border-white/10 space-y-3">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={chatMode === 'PRIVATE' ? "Secret coordination..." : "Broadcast to match..."}
                            className="bg-black/50 border-white/10 text-white pl-4 h-12 rounded-xl focus-visible:ring-purple-500/50"
                        />
                    </div>
                    <Button
                        size="icon"
                        onClick={handleSendMessage}
                        className="bg-purple-600 hover:bg-purple-700 shrink-0 h-12 w-12 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
                {chatMode === 'PRIVATE' && (
                    <div className="flex items-center justify-center gap-2 text-[10px] text-amber-500/80 uppercase tracking-widest font-black">
                        <Lock className="h-3 w-3" />
                        Encrypted P2P Communication
                    </div>
                )}
            </div>
        </div>
    );
};

const Badge = ({ children, className, variant = "default" }: any) => (
    <span className={cn(
        "px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase",
        variant === "default" ? "bg-primary/20 text-primary border border-primary/30" : "border border-white/10 text-gray-500",
        className
    )}>
        {children}
    </span>
);
