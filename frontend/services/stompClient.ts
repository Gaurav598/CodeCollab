import { Client, IMessage } from '@stomp/stompjs';
import { getAccessToken } from '@/services/authService';

class StompService {
    private client: Client | null = null;
    private subscriptions: Map<string, any> = new Map();

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
        }
    }

    public subscribe(destination: string, callback: (message: IMessage) => void) {
        if (!this.client || !this.client.connected) {
            console.warn(`[STOMP] Cannot subscribe to ${destination}, not connected`);
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
            console.error(`[STOMP] Cannot publish to ${destination}, client disconnected`);
        }
    }
}

export const stompService = new StompService();
