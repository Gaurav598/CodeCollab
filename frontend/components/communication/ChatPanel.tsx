import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Send, X, MessageSquare, Trash2 } from 'lucide-react';

interface ChatPanelProps {
    roomId: string;
    userRole?: string;
    onClose?: () => void;
}

export function ChatPanel({ roomId, userRole, onClose }: ChatPanelProps) {
    const { messagesByRoom, sendMessage, deleteMessage } = useChatStore();
    const currentUser = useAuthStore(state => state.user);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const messages = messagesByRoom[roomId] || [];

    useEffect(() => {
        useChatStore.getState().fetchHistory(roomId);
    }, [roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        setIsSending(true);
        setTimeout(() => setIsSending(false), 150);

        sendMessage(roomId, inputValue.trim());
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-background border-l border-border text-foreground">
            <div className="p-4 border-b border-border relative flex justify-center items-center bg-muted/10 overflow-hidden min-h-[53px]">
                <style>{`
                    @keyframes slideCenter {
                        from { transform: translateX(-150%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `}</style>
                <h2 
                    className="text-[13px] font-bold tracking-widest uppercase flex items-center gap-2 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent drop-shadow-sm"
                    style={{ animation: 'slideCenter 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
                >
                    <MessageSquare size={14} className="text-primary" />
                    ROOM CHAT
                </h2>
                {onClose && (
                    <button onClick={onClose} className="absolute right-4 p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors">
                        <X size={18} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center h-full min-h-[200px] text-muted-foreground">
                        <MessageSquare className="text-muted-foreground/30 mb-2" size={32} />
                        <span className="text-sm font-semibold text-foreground">No messages yet</span>
                        <p className="text-xs text-muted-foreground mt-1">Send a message to start the conversation.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === currentUser?.id;
                        const hasMention = msg.message.includes(`@${currentUser?.username}`);

                        return (
                            <div key={msg.id} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-muted-foreground font-medium">{msg.senderName}</span>
                                    {userRole === 'owner' && !msg.deleted && (
                                        <button 
                                            onClick={() => deleteMessage(roomId, msg.id)}
                                            className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                                            title="Delete Message"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                                <div 
                                    className={`px-3 py-2 rounded-lg max-w-[90%] break-words whitespace-pre-wrap text-[13px] shadow-sm ${
                                        msg.deleted 
                                            ? 'bg-muted/50 text-muted-foreground italic border border-border/50'
                                            : isMe 
                                                ? 'bg-primary text-primary-foreground' 
                                                : hasMention 
                                                    ? 'bg-warning/20 text-foreground border border-warning/30 font-medium'
                                                    : 'bg-muted text-foreground border border-border'
                                    }`}
                                >
                                    {msg.deleted ? (
                                        msg.message
                                    ) : (
                                        msg.message.split(/(```[\s\S]*?```)/g).map((part, index) => {
                                            if (part.startsWith('```') && part.endsWith('```')) {
                                                const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
                                                if (match) {
                                                    const lang = match[1];
                                                    const code = match[2];
                                                    return (
                                                        <div key={index} className={`my-2 bg-[#1e1e1e] rounded-md overflow-hidden border border-black/20 text-left ${isMe ? 'shadow-inner' : 'shadow-sm'}`}>
                                                            {lang && (
                                                                <div className="bg-black/40 px-3 py-1 text-[10px] font-mono text-gray-400 uppercase border-b border-white/5">
                                                                    {lang}
                                                                </div>
                                                            )}
                                                            <pre className="p-3 text-[12px] font-mono text-blue-300 overflow-x-auto scrollbar-thin">
                                                                <code>{code}</code>
                                                            </pre>
                                                        </div>
                                                    );
                                                }
                                            }
                                            return <span key={index}>{part}</span>;
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-border flex items-end gap-2 bg-muted/10">
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 bg-muted/50 border border-border text-foreground placeholder-muted-foreground rounded-md px-3 py-2 min-h-[36px] max-h-[120px] text-[13px] focus:outline-none focus:ring-1 focus:ring-primary transition-shadow resize-none scrollbar-thin"
                />
                <button
                    type="submit"
                    className={`flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground w-9 h-9 rounded-md transition-all duration-150 shrink-0 mb-[1px] shadow-sm hover:shadow-md ${isSending ? 'scale-90 shadow-none -translate-y-0' : 'hover:-translate-y-0.5'}`}
                >
                    <Send size={15} />
                </button>
            </form>
        </div>
    );
}

