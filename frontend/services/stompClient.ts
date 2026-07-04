import { Client, IMessage } from '@stomp/stompjs';
import { getAccessToken } from '@/services/authService';
import { serviceConfig } from './config';

class StompService {
    private client: Client | null = null;
    private activeSubscriptions: Map<string, { callbacks: Set<(msg: IMessage) => void>; subscription: any }> = new Map();
    private pendingSubscriptions: Array<{destination: string, callback: (msg: IMessage) => void}> = [];
    private pendingMessages: Array<{destination: string, body: any}> = [];

    public connect() {
        if (this.client && this.client.active) return;

        const token = getAccessToken();
        if (!token) return;

        this.client = new Client({
            brokerURL: serviceConfig.stompWebSocketUrl,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('[STOMP] Connected');
                
                // Re-subscribe to user notifications
                this.client?.subscribe('/user/queue/notifications', (msg) => {
                    import('@/store/notificationStore').then(({ useNotificationStore }) => {
                        const notif = JSON.parse(msg.body);
                        useNotificationStore.getState().addNotification(notif);
                    });
                });

                // Re-subscribe all active subscriptions on reconnect
                const currentSubs = Array.from(this.activeSubscriptions.entries());
                this.activeSubscriptions.clear();
                for (const [destination, item] of currentSubs) {
                    console.log(`[STOMP] Re-subscribing to ${destination}`);
                    item.callbacks.forEach(cb => this.subscribe(destination, cb));
                }

                // Process pending subscriptions
                while (this.pendingSubscriptions.length > 0) {
                    const sub = this.pendingSubscriptions.shift();
                    if (sub) this.subscribe(sub.destination, sub.callback);
                }

                // Process pending messages
                while (this.pendingMessages.length > 0) {
                    const msg = this.pendingMessages.shift();
                    if (msg) this.publish(msg.destination, msg.body);
                }
            },
            onStompError: (frame) => {
                console.error('[STOMP] Broker reported error: ' + frame.headers['message']);
                console.error('[STOMP] Additional details: ' + frame.body);
            },
            onWebSocketClose: () => {
                console.log('[STOMP] WebSocket Closed');
            }
        });

        this.client.activate();
    }

    public disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
            this.activeSubscriptions.clear();
            this.pendingSubscriptions = [];
            this.pendingMessages = [];
        }
    }

    public subscribe(destination: string, callback: (message: IMessage) => void) {
        if (!this.client || !this.client.connected) {
            console.warn(`[STOMP] Cannot subscribe to ${destination} right now. Queuing subscription.`);
            if (!this.pendingSubscriptions.some(s => s.destination === destination && s.callback === callback)) {
                this.pendingSubscriptions.push({ destination, callback });
            }
            if (!this.activeSubscriptions.has(destination)) {
                this.activeSubscriptions.set(destination, { callbacks: new Set([callback]), subscription: null });
            } else {
                this.activeSubscriptions.get(destination)!.callbacks.add(callback);
            }
            return null;
        }

        const existing = this.activeSubscriptions.get(destination);
        if (existing && existing.subscription) {
            existing.callbacks.add(callback);
            return existing.subscription;
        }

        try {
            const callbacks = existing ? existing.callbacks.add(callback) : new Set([callback]);
            const sub = this.client.subscribe(destination, (msg) => {
                const current = this.activeSubscriptions.get(destination);
                if (current) {
                    current.callbacks.forEach(cb => cb(msg));
                }
            });
            this.activeSubscriptions.set(destination, { callbacks, subscription: sub });
            return sub;
        } catch (err) {
            console.error(`[STOMP] Failed to subscribe to ${destination}`, err);
            return null;
        }
    }

    public unsubscribe(destination: string, callback?: (message: IMessage) => void) {
        if (callback) {
            this.pendingSubscriptions = this.pendingSubscriptions.filter(s => !(s.destination === destination && s.callback === callback));
        } else {
            this.pendingSubscriptions = this.pendingSubscriptions.filter(s => s.destination !== destination);
        }

        const existing = this.activeSubscriptions.get(destination);
        if (existing) {
            if (callback) {
                existing.callbacks.delete(callback);
                if (existing.callbacks.size > 0) return; // Still have listeners
            }
            
            if (existing.subscription) {
                try {
                    existing.subscription.unsubscribe();
                } catch (err) {
                    console.error(`[STOMP] Failed to unsubscribe from ${destination}`, err);
                }
            }
            this.activeSubscriptions.delete(destination);
        }
    }

    public publish(destination: string, body: any) {
        if (this.client && this.client.connected) {
            this.client.publish({ 
                destination, 
                body: JSON.stringify(body),
                headers: { 'content-type': 'application/json' }
            });
        } else {
            console.warn(`[STOMP] Client disconnected, queueing message for ${destination}`);
            this.pendingMessages.push({ destination, body });
        }
    }
}

export const stompService = new StompService();
