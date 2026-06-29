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
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
                    <div className="p-3 border-b border-border flex justify-between items-center bg-muted/30">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                No new notifications
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    className={`p-3 border-b border-border/50 flex gap-3 hover:bg-muted/40 transition-colors ${!notif.isRead ? 'bg-primary/10' : ''}`}
                                >
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-foreground">{notif.title}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{notif.body}</div>
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
