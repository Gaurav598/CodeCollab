import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { syncConfig } from '../services/syncConfig';
import { useAuthStore } from '../store/authStore';
import { getAccessToken } from '../services/authService';

export function useYjsDoc(roomId: string, fileId: string | null) {
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const user = useAuthStore(state => state.user);
  const token = getAccessToken();

  useEffect(() => {
    if (!fileId || !roomId || !token || !user) {
      return;
    }

    const ydoc = new Y.Doc();
    const wsUrl = syncConfig.getWsUrl();
    const roomPath = `sync?roomId=${encodeURIComponent(roomId)}&fileId=${encodeURIComponent(fileId)}&token=${encodeURIComponent(token)}`;

    const wsProvider = new WebsocketProvider(wsUrl, roomPath, ydoc);

    // Ensure our presence state is seeded immediately
    const userColor = getUserColor(user.id);
    wsProvider.awareness.setLocalStateField('user', {
      id: user.id,
      name: user.username,
      color: userColor
    });

    wsProvider.on('status', (event: { status: string }) => {
      setConnected(event.status === 'connected');
    });

    setDoc(ydoc);
    setProvider(wsProvider);

    return () => {
      wsProvider.disconnect();
      wsProvider.destroy();
      ydoc.destroy();
      setDoc(null);
      setProvider(null);
      setConnected(false);
    };
  }, [roomId, fileId, token, user]);

  return { doc, provider, connected };
}

// Deterministic color assignment based on User ID
function getUserColor(userId: string): string {
  const colors = [
    '#FF3B30', '#FF9500', '#FFCC00', '#4CD964',
    '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55'
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
