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
      const states = Array.from(provider.awareness.getStates().entries());
      console.log(`\n================================`);
      console.log(`[PRESENCE] awareness.getStates() returned ${states.length} total entries.`);
      
      const uniqueUsers = new Map<string, UserAwareness>();
      states.forEach(([clientId, state]: any) => {
        console.log(`[PRESENCE] Client ID ${clientId} state:`, state);
        if (state.user) {
          uniqueUsers.set(state.user.id, state.user as UserAwareness);
        }
      });
      
      const uniqueCount = uniqueUsers.size;
      console.log(`[PRESENCE] Unique User Count: ${uniqueCount}`);
      console.log(`================================\n`);
      
      setUsers(Array.from(uniqueUsers.values()));
    };

    const handleChange = (changes: any, origin: any) => {
      console.log(`[PRESENCE] Awareness 'change' event fired. Origin: ${origin}`, changes);
      updateAwareness();
    };

    provider.awareness.on('change', handleChange);
    
    updateAwareness();

    return () => {
      provider.awareness.off('change', handleChange);
    };
  }, [provider]);

  return users;
}
