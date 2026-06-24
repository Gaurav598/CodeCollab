import { create } from 'zustand';

export interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    timestamp: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    setNotifications: (notifications: Notification[]) => void;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => void;
    setUnreadCount: (count: number) => void;
    fetchNotifications: () => Promise<void>;
}

import { apiFetch } from '@/services/authService';

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    unreadCount: 0,
    setNotifications: (notifications) => set({ notifications }),
    addNotification: (notification) => set((state) => ({ 
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification.isRead ? 0 : 1)
    })),
    markAsRead: async (id) => {
        try {
            await apiFetch(`/notifications/${id}/read`, { method: 'POST' });
            set((state) => ({
                notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
                unreadCount: Math.max(0, state.unreadCount - 1)
            }));
        } catch (e) {
            console.error("Failed to mark notification read", e);
        }
    },
    setUnreadCount: (count) => set({ unreadCount: count }),
    fetchNotifications: async () => {
        try {
            const data = await apiFetch<any>('/notifications?page=0&size=20');
            const countData = await apiFetch<number>('/notifications/unread-count');
            set({ notifications: data.content, unreadCount: countData });
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        }
    }
}));
