import { Client, IMessage } from '@stomp/stompjs';
import { getAccessToken } from '@/services/authService';

class StompService {
    private client: Client | null = null;
    private subscriptions: Map<string, any> = new Map();
    private pendingSubscriptions: Array<{destination: string, callback: (msg: IMessage) => void}> = [];
    private pendingMessages: Array<{destination: string, body: any}> = [];

    public connect() {
        if (this.client && this.client.active) return;

        const token = getAccessToken();
        if (!token) return;

        this.client = new Client({
            brokerURL: `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'}/ws`,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('[STOMP] Connected');
                
                // Re-subscribe to active channels if necessary
                this.client?.subscribe('/user/queue/notifications', (msg) => {
                    import('@/store/notificationStore').then(({ useNotificationStore }) => {
                        const notif = JSON.parse(msg.body);
                        useNotificationStore.getState().addNotification(notif);
                    });
                });

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
            this.subscriptions.clear();
            this.pendingSubscriptions = [];
            this.pendingMessages = [];
        }
    }

    public subscribe(destination: string, callback: (message: IMessage) => void) {
        if (!this.client || !this.client.connected) {
            console.warn(`[STOMP] Cannot subscribe to ${destination} right now. Queuing subscription.`);
            this.pendingSubscriptions.push({ destination, callback });
            return null;
        }

        if (this.subscriptions.has(destination)) {
            return this.subscriptions.get(destination);
        }

        const sub = this.client.subscribe(destination, callback);
        this.subscriptions.set(destination, sub);
        return sub;
    }

    public unsubscribe(destination: string) {
        // Also remove from pending if present
        this.pendingSubscriptions = this.pendingSubscriptions.filter(s => s.destination !== destination);

        const sub = this.subscriptions.get(destination);
        if (sub) {
            sub.unsubscribe();
            this.subscriptions.delete(destination);
        }
    }

    public publish(destination: string, body: any) {
        if (this.client && this.client.connected) {
            this.client.publish({ destination, body: JSON.stringify(body) });
        } else {
            console.warn(`[STOMP] Client disconnected, queueing message for ${destination}`);
            this.pendingMessages.push({ destination, body });
        }
    }
}

export const stompService = new StompService();
