import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Send, X } from 'lucide-react';

interface ChatPanelProps {
    roomId: string;
    onClose?: () => void;
}

export function ChatPanel({ roomId, onClose }: ChatPanelProps) {
    const { messagesByRoom, sendMessage, subscribeToRoom, unsubscribeFromRoom } = useChatStore();
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
        <div className="flex flex-col h-full w-full bg-zinc-900 border-l border-zinc-800 text-zinc-100">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Room Chat</h2>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded">
                        <X size={18} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const hasMention = msg.message.includes(`@${currentUser?.username}`);

                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <span className="text-xs text-zinc-400 mb-1">{msg.senderName}</span>
                            <div 
                                className={`px-3 py-2 rounded-lg max-w-[90%] break-words ${
                                    isMe 
                                        ? 'bg-blue-600 text-white' 
                                        : hasMention 
                                            ? 'bg-yellow-600 text-white'
                                            : 'bg-zinc-800 text-zinc-200'
                                }`}
                            >
                                {msg.message}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 flex items-center gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 h-9 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
                />
                <button
                    type="submit"
                    className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white w-9 h-9 rounded-md transition-colors shrink-0"
                >
                    <Send size={15} />
                </button>
            </form>
        </div>
    );
}
