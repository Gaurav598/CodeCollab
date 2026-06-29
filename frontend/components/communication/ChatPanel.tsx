import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Send, X, MessageSquare } from 'lucide-react';

interface ChatPanelProps {
    roomId: string;
    onClose?: () => void;
}

export function ChatPanel({ roomId, onClose }: ChatPanelProps) {
    const { messagesByRoom, sendMessage } = useChatStore();
    const currentUser = useAuthStore(state => state.user);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const messages = messagesByRoom[roomId] || [];

    useEffect(() => {
        useChatStore.getState().fetchHistory(roomId);
    }, [roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        sendMessage(roomId, inputValue.trim());
        setInputValue('');
    };

    return (
        <div className="flex flex-col h-full w-full bg-background border-l border-border text-foreground">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
                <h2 className="text-sm font-semibold">Room Chat</h2>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors">
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
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className="text-xs text-muted-foreground mb-1 font-medium">{msg.senderName}</span>
                                <div 
                                    className={`px-3 py-2 rounded-lg max-w-[90%] break-words text-sm shadow-sm ${
                                        isMe 
                                            ? 'bg-primary text-primary-foreground' 
                                            : hasMention 
                                                ? 'bg-warning/20 text-foreground border border-warning/30 font-medium'
                                                : 'bg-muted text-foreground border border-border'
                                    }`}
                                >
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-border flex items-center gap-2 bg-muted/10">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-muted/50 border border-border text-foreground placeholder-muted-foreground rounded-md px-3 h-9 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                />
                <button
                    type="submit"
                    className="flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground w-9 h-9 rounded-md transition-colors shrink-0"
                >
                    <Send size={15} />
                </button>
            </form>
        </div>
    );
}

