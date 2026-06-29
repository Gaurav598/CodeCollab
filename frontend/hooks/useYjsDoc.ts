import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { syncConfig } from '../services/syncConfig';
import { useAuthStore } from '../store/authStore';
import { getAccessToken } from '../services/authService';

export function useYjsDoc(roomId: string, activeFileId: string | null, openFileIds: string[]) {
  const [activeDoc, setActiveDoc] = useState<Y.Doc | null>(null);
  const [activeProvider, setActiveProvider] = useState<WebsocketProvider | null>(null);
  const [connected, setConnected] = useState(false);
  
  const connectionsRef = useRef<Map<string, { doc: Y.Doc, provider: WebsocketProvider }>>(new Map());
  const user = useAuthStore(state => state.user);
  const token = getAccessToken();

  useEffect(() => {
    if (!roomId || !token || !user) return;

    const currentConnections = connectionsRef.current;
    
    // Connect new tabs
    openFileIds.forEach(fileId => {
      if (!currentConnections.has(fileId)) {
        const ydoc = new Y.Doc();
        const wsUrl = syncConfig.getWsUrl();
        const roomPath = `sync?roomId=${encodeURIComponent(roomId)}&fileId=${encodeURIComponent(fileId)}&token=${encodeURIComponent(token)}`;
        const wsProvider = new WebsocketProvider(wsUrl, roomPath, ydoc);

        const userColor = getUserColor(user.id);
        wsProvider.awareness.setLocalStateField('user', {
          id: user.id,
          name: user.username,
          color: userColor
        });

        currentConnections.set(fileId, { doc: ydoc, provider: wsProvider });
      }
    });

    // Cleanup closed tabs
    for (const [fileId, connection] of currentConnections.entries()) {
      if (!openFileIds.includes(fileId)) {
        connection.provider.disconnect();
        // Delay destruction to allow MonacoBinding to cleanly unobserve first
        setTimeout(() => {
          connection.provider.destroy();
          connection.doc.destroy();
        }, 50);
        currentConnections.delete(fileId);
      }
    }

  }, [roomId, openFileIds, token, user]);

  // Global cleanup on hook unmount
  useEffect(() => {
    const currentConnections = connectionsRef.current;
    return () => {
      for (const [fileId, connection] of currentConnections.entries()) {
        connection.provider.disconnect();
        setTimeout(() => {
          connection.provider.destroy();
          connection.doc.destroy();
        }, 50);
      }
      currentConnections.clear();
    };
  }, []);

  useEffect(() => {
    if (!activeFileId || !connectionsRef.current.has(activeFileId)) {
      setActiveDoc(null);
      setActiveProvider(null);
      setConnected(false);
      return;
    }

    const { doc, provider } = connectionsRef.current.get(activeFileId)!;
    setActiveDoc(doc);
    setActiveProvider(provider);
    
    const handleStatus = (event: { status: string }) => {
      setConnected(event.status === 'connected');
    };
    
    setConnected(provider.wsconnected);
    provider.on('status', handleStatus);
    
    return () => {
      provider.off('status', handleStatus);
    };
  }, [activeFileId, openFileIds]); // openFileIds included so it reruns if a new active connection was just created

  return { doc: activeDoc, provider: activeProvider, connected };
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
