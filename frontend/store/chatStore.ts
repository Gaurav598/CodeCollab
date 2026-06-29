import { create } from 'zustand';
import { stompService } from '@/services/stompClient';
import { apiFetch } from '@/services/authService';
import { useAuthStore } from './authStore';

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    createdAt: string;
    deleted?: boolean;
}

interface ChatState {
    messagesByRoom: Record<string, ChatMessage[]>;
    activeRoomId: string | null;
    setActiveRoom: (roomId: string) => void;
    addMessage: (roomId: string, message: ChatMessage) => void;
    setMessages: (roomId: string, messages: ChatMessage[]) => void;
    fetchHistory: (roomId: string) => Promise<void>;
    sendMessage: (roomId: string, message: string) => void;
    deleteMessage: (roomId: string, messageId: string) => void;
    subscribeToRoom: (roomId: string) => void;
    unsubscribeFromRoom: (roomId: string) => void;
}

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
        const id = crypto.randomUUID();
        const currentUser = useAuthStore.getState().user;
        
        // Optimistic UI Update
        if (currentUser) {
            get().addMessage(roomId, {
                id,
                senderId: currentUser.id,
                senderName: currentUser.username,
                message: messageText,
                createdAt: new Date().toISOString()
            });
        }

        stompService.publish('/app/chat.send', {
            id,
            roomId,
            message: messageText,
        });
    },

    deleteMessage: (roomId, messageId) => {
        stompService.publish('/app/chat.delete', { roomId, messageId });
    },

    subscribeToRoom: (roomId) => {
        stompService.publish('/app/room.join', { roomId });
        
        stompService.subscribe(`/topic/room.${roomId}.chat`, (stompMessage) => {
            const chatMsg = JSON.parse(stompMessage.body) as ChatMessage;
            get().addMessage(roomId, chatMsg);
        });

        stompService.subscribe(`/topic/room.${roomId}.chat.delete`, (stompMessage) => {
            const deletedMsg = JSON.parse(stompMessage.body) as ChatMessage;
            set((state) => {
                const roomMessages = state.messagesByRoom[roomId] || [];
                return {
                    messagesByRoom: {
                        ...state.messagesByRoom,
                        [roomId]: roomMessages.map(m => m.id === deletedMsg.id ? deletedMsg : m)
                    }
                };
            });
        });
    },

    unsubscribeFromRoom: (roomId) => {
        stompService.publish('/app/room.leave', { roomId });
        stompService.unsubscribe(`/topic/room.${roomId}.chat`);
        stompService.unsubscribe(`/topic/room.${roomId}.chat.delete`);
        stompService.unsubscribe(`/topic/room.${roomId}.presence`);
        // Clear ephemeral messages locally on leave
        set((state) => {
            const next = { ...state.messagesByRoom };
            delete next[roomId];
            return { messagesByRoom: next };
        });
    },
}));
