import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageSquare, ToggleLeft, ToggleRight } from 'lucide-react';
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
    const scrollRef = useRef<HTMLDivElement>(null);

    // Mock initial messages
    useEffect(() => {
        setMessages([
            {
                id: '1',
                sender_id: 'sys',
                sender_name: 'System',
                text: 'Private match chat started. Good luck!',
                timestamp: new Date().toISOString(),
                is_spectator: false
            },
            {
                id: '2',
                sender_id: 'm1',
                sender_name: 'SpectatorBot',
                avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bot',
                text: 'This is going to be a close one! 🍿',
                timestamp: new Date().toISOString(),
                is_spectator: true
            }
        ]);
    }, [matchId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, showSpectatorChat]);

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            sender_id: user?.id || 'anon',
            sender_name: user?.user_metadata?.username || 'Guest',
            avatar_url: user?.user_metadata?.avatar_url,
            text: inputText,
            timestamp: new Date().toISOString(),
            is_spectator: !isPlayer
        };

        setMessages([...messages, newMessage]);
        setInputText('');
    };

    const filteredMessages = messages.filter(msg => {
        if (!msg.is_spectator) return true; // Always show player/system messages
        return spectatorChatEnabled && showSpectatorChat; // Show spectator messages only if enabled
    });

    return (
        <div className="flex flex-col h-[500px] bg-gray-900 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-400" />
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider">Match Chat</h3>
                    {isPlayer && (
                        <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-[10px]">PLAYER</Badge>
                    )}
                </div>

                {spectatorChatEnabled && (
                    <button
                        onClick={() => setShowSpectatorChat(!showSpectatorChat)}
                        className="flex items-center gap-2 text-[10px] text-gray-400 hover:text-white transition-colors"
                    >
                        <Users className="h-3 w-3" />
                        {showSpectatorChat ? 'Spectators ON' : 'Spectators OFF'}
                        {showSpectatorChat ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
            >
                {filteredMessages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex gap-3 animate-in fade-in slide-in-from-bottom-2",
                            msg.sender_id === user?.id ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        <Avatar className="h-8 w-8 border border-white/10 shrink-0">
                            <AvatarImage src={msg.avatar_url} />
                            <AvatarFallback className="bg-gray-800 text-[10px]">{msg.sender_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                            "flex flex-col max-w-[70%]",
                            msg.sender_id === user?.id ? "items-end" : "items-start"
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-gray-400">{msg.sender_name}</span>
                                {msg.is_spectator && <Badge variant="outline" className="text-[8px] py-0 px-1 border-white/10 text-gray-500">SPECTATOR</Badge>}
                                <span className="text-[8px] text-gray-600">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={cn(
                                "px-3 py-2 rounded-2xl text-sm",
                                msg.sender_id === user?.id
                                    ? "bg-purple-600 text-white rounded-tr-none"
                                    : "bg-white/5 text-gray-200 rounded-tl-none border border-white/5"
                            )}>
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/5 border-t border-white/10">
                <div className="flex gap-2">
                    <Input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={isPlayer ? "Type a message..." : "Spectator chat..."}
                        className="bg-gray-800 border-white/10 text-white"
                    />
                    <Button
                        size="icon"
                        onClick={handleSendMessage}
                        className="bg-purple-600 hover:bg-purple-700 shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-[9px] text-gray-500 mt-2 text-center italic">
                    {isPlayer ? "Players-only messages are private." : "Spectators can see this chat if enabled."}
                </p>
            </div>
        </div>
    );
};

const Badge = ({ children, className, variant = "default" }: any) => (
    <span className={cn(
        "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
        variant === "default" ? "bg-primary/20 text-primary border border-primary/30" : "border",
        className
    )}>
        {children}
    </span>
);
