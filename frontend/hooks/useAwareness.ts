import { useEffect, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';

export interface UserAwareness {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number, ch: number };
  selection?: { startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number };
}

export function useAwareness(provider: WebsocketProvider | null) {
  const [users, setUsers] = useState<UserAwareness[]>([]);

  useEffect(() => {
    if (!provider) {
      setUsers([]);
      return;
    }

    const updateAwareness = () => {
      const states = Array.from(provider.awareness.getStates().values());
      const activeUsers = states
        .filter((state: any) => state.user !== undefined)
        .map((state: any) => state.user as UserAwareness);
      setUsers(activeUsers);
    };

    provider.awareness.on('change', updateAwareness);
    updateAwareness();

    return () => {
      provider.awareness.off('change', updateAwareness);
    };
  }, [provider]);

  return users;
}
