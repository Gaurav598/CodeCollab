import React from 'react';
import { UserAwareness } from '../../hooks/useAwareness';
import { Users } from 'lucide-react';

interface PresencePanelProps {
  users: UserAwareness[];
}

export function PresencePanel({ users }: PresencePanelProps) {
  return (
    <div className="flex items-center space-x-2 px-4 h-12 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <Users className="w-4 h-4 text-neutral-500" />
      <span className="text-sm text-neutral-500 font-medium">
        {users.length} {users.length === 1 ? 'user' : 'users'} online
      </span>
      <div className="flex-1" />
      <div className="flex -space-x-2 overflow-hidden">
        {users.map(user => (
          <div
            key={user.id}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            <span className="text-xs font-medium text-white uppercase">
              {user.name.substring(0, 2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
