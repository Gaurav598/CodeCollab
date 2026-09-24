import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { syncConfig } from '../services/syncConfig';
import { useAuthStore } from '../store/authStore';
import { getAccessToken, subscribeAccessToken } from '../services/authService';

export function useYjsDoc(roomId: string, activeFileId: string | null, openFileIds: string[]) {
  const [activeDoc, setActiveDoc] = useState<Y.Doc | null>(null);
  const [activeProvider, setActiveProvider] = useState<WebsocketProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'syncing' | 'live' | 'offline'>('offline');
  
  const connectionsRef = useRef<Map<string, { doc: Y.Doc, provider: WebsocketProvider, token: string }>>(new Map());
  const user = useAuthStore(state => state.user);
  const [token, setToken] = useState<string | null>(() => getAccessToken());

  useEffect(() => subscribeAccessToken(setToken), []);

  useEffect(() => {
    if (!roomId || !token || !user) return;

    const currentConnections = connectionsRef.current;

    // Access-token rotation must also rotate WebSocket credentials. Existing
    // Y.Docs are safely recreated from the server's authoritative CRDT state.
    for (const [fileId, connection] of currentConnections.entries()) {
      if (connection.token !== token) {
        connection.provider.destroy();
        connection.doc.destroy();
        currentConnections.delete(fileId);
      }
    }
    
    // Connect new tabs
    openFileIds.forEach(fileId => {
      if (!currentConnections.has(fileId)) {
        const ydoc = new Y.Doc();
        const wsUrl = syncConfig.getWsUrl();
        const roomPath = `sync?roomId=${encodeURIComponent(roomId)}&fileId=${encodeURIComponent(fileId)}&token=${encodeURIComponent(token)}`;
        const wsProvider = new WebsocketProvider(wsUrl, roomPath, ydoc);
        
        wsProvider.on('connection-error', (event: any) => {
          console.warn(`[Yjs] Connection error for file ${fileId}`, event);
        });

        wsProvider.on('connection-close', (event: any) => {
          if (event?.code === 4403) console.warn(`[Yjs] Access revoked for file ${fileId}`);
        });

        const userColor = getUserColor(user.id);
        wsProvider.awareness.setLocalStateField('user', {
          id: user.id,
          name: user.username,
          color: userColor
        });
        
        currentConnections.set(fileId, { doc: ydoc, provider: wsProvider, token });
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
      setSyncStatus('offline');
      return;
    }

    const { doc, provider } = connectionsRef.current.get(activeFileId)!;
    setActiveDoc(doc);
    setActiveProvider(provider);
    
    const handleStatus = (event: { status: string }) => {
      const isConnected = event.status === 'connected';
      setConnected(isConnected);
      setSyncStatus(isConnected ? (provider.synced ? 'live' : 'syncing') : 'connecting');
    };
    const handleSync = (isSynced: boolean) => setSyncStatus(isSynced ? 'live' : 'syncing');
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    const handleUpdate = (_update: Uint8Array, origin: unknown) => {
      if (origin === provider) return;
      setSyncStatus(provider.wsconnected ? 'syncing' : 'offline');
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        setSyncStatus(provider.wsconnected ? 'live' : 'offline');
      }, 600);
    };
    
    setConnected(provider.wsconnected);
    setSyncStatus(provider.wsconnected ? (provider.synced ? 'live' : 'syncing') : 'connecting');
    provider.on('status', handleStatus);
    provider.on('sync', handleSync);
    doc.on('update', handleUpdate);
    
    return () => {
      provider.off('status', handleStatus);
      provider.off('sync', handleSync);
      doc.off('update', handleUpdate);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [activeFileId, openFileIds]); // openFileIds included so it reruns if a new active connection was just created

  return { doc: activeDoc, provider: activeProvider, connected, syncStatus };
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
