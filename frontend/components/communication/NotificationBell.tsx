import React, { useState } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { Bell, Check } from 'lucide-react';

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, fetchNotifications } = useNotificationStore();
    const [isOpen, setIsOpen] = useState(false);

    React.useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
                className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
                    <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                        <h3 className="font-semibold text-zinc-100">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-zinc-500 text-sm">
                                No new notifications
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    className={`p-3 border-b border-zinc-800/50 flex gap-3 hover:bg-zinc-800/50 transition-colors ${!notif.isRead ? 'bg-blue-900/10' : ''}`}
                                >
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-zinc-200">{notif.title}</div>
                                        <div className="text-xs text-zinc-400 mt-1">{notif.body}</div>
                                    </div>
                                    {!notif.isRead && (
                                        <button 
                                            onClick={() => markAsRead(notif.id)}
                                            className="text-blue-500 hover:text-blue-400 p-1"
                                            title="Mark as read"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
