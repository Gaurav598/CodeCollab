import { create } from 'zustand';
import { stompService } from '@/services/stompClient';

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    createdAt: string;
}

interface ChatState {
    messagesByRoom: Record<string, ChatMessage[]>;
    activeRoomId: string | null;
    setActiveRoom: (roomId: string) => void;
    addMessage: (roomId: string, message: ChatMessage) => void;
    setMessages: (roomId: string, messages: ChatMessage[]) => void;
    fetchHistory: (roomId: string) => Promise<void>;
    sendMessage: (roomId: string, message: string) => void;
    subscribeToRoom: (roomId: string) => void;
    unsubscribeFromRoom: (roomId: string) => void;
}

import { apiFetch } from '@/services/authService';

export const useChatStore = create<ChatState>((set, get) => ({
    messagesByRoom: {},
    activeRoomId: null,

    setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

    addMessage: (roomId, message) => {
        set((state) => {
            const roomMessages = state.messagesByRoom[roomId] || [];
            if (roomMessages.some((m) => m.id === message.id)) return state; // Deduplicate
            return {
                messagesByRoom: {
                    ...state.messagesByRoom,
                    [roomId]: [...roomMessages, message],
                },
            };
        });
    },

    setMessages: (roomId, messages) => {
        set((state) => ({
            messagesByRoom: {
                ...state.messagesByRoom,
                [roomId]: [...messages], // in-memory messages are already in order (oldest first)
            },
        }));
    },

    fetchHistory: async (roomId) => {
        try {
            const data = await apiFetch<ChatMessage[] | { content: ChatMessage[] }>(`/chat/${roomId}/history`);
            // Handle both List (new ephemeral) and Page (legacy) responses
            const messages = Array.isArray(data) ? data : (data as any)?.content ?? [];
            get().setMessages(roomId, messages);
        } catch (error) {
            console.error("Failed to fetch chat history", error);
        }
    },

    sendMessage: (roomId, messageText) => {
        stompService.publish('/app/chat.send', {
            roomId,
            message: messageText,
        });
    },

    subscribeToRoom: (roomId) => {
        stompService.publish('/app/room.join', { roomId });
        
        stompService.subscribe(`/topic/room.${roomId}.chat`, (stompMessage) => {
            const chatMsg = JSON.parse(stompMessage.body) as ChatMessage;
            get().addMessage(roomId, chatMsg);
        });
    },

    unsubscribeFromRoom: (roomId) => {
        stompService.publish('/app/room.leave', { roomId });
        stompService.unsubscribe(`/topic/room.${roomId}.chat`);
        stompService.unsubscribe(`/topic/room.${roomId}.presence`);
        // Clear ephemeral messages locally on leave
        set((state) => {
            const next = { ...state.messagesByRoom };
            delete next[roomId];
            return { messagesByRoom: next };
        });
    },
}));
