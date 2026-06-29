import React, { useRef, useState, useEffect } from 'react';
import { UserAwareness } from '../../hooks/useAwareness';
import { Users, ChevronDown, Save, Loader2, Code2 } from 'lucide-react';
import { TabData } from '@/store/workspaceStore';

interface PresencePanelProps {
  users: UserAwareness[];
  activeFile?: TabData;
  onLanguageChange?: (language: string) => void;
  onSave?: (showSavedCodes: boolean) => void;
  isSaving?: boolean;
}

const LANGUAGES = [
  { id: 'java', name: 'Java' },
  { id: 'c', name: 'C' },
  { id: 'cpp', name: 'C++' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
];

export function PresencePanel({ users, activeFile, onLanguageChange, onSave, isSaving }: PresencePanelProps) {
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLanguage = LANGUAGES.find(l => l.id === activeFile?.language) || LANGUAGES[0];

  return (
    <div className="flex items-center space-x-2 px-4 h-12 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <Users className="w-4 h-4 text-neutral-500" />
      <span className="text-sm text-neutral-500 font-medium">
        {users.length} {users.length === 1 ? 'user' : 'users'} online
      </span>
      
      {activeFile && (
        <div className="relative ml-4" ref={dropdownRef}>
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center space-x-1 text-[13px] text-neutral-700 dark:text-neutral-300 transition-colors px-2.5 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm"
          >
            <span>{currentLanguage.name}</span>
            <ChevronDown size={14} />
          </button>
          
          {showLanguageDropdown && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-lg z-50 py-1">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  className={`w-full text-left px-4 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
                    activeFile.language === lang.id ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-neutral-700 dark:text-neutral-300'
                  }`}
                  onClick={() => {
                    onLanguageChange?.(lang.id);
                    setShowLanguageDropdown(false);
                  }}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1" />
      
      {activeFile && (
        <div className="flex items-center space-x-2 mr-4">
          <button
            onClick={() => onSave?.(true)}
            className="flex items-center space-x-1.5 text-[13px] font-medium text-neutral-700 dark:text-neutral-300 transition-colors px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm disabled:opacity-50"
          >
            <Code2 size={14} />
            <span>Saved Codes</span>
          </button>

          <button
            onClick={() => onSave?.(false)}
            disabled={isSaving}
            className="flex items-center space-x-1.5 text-[13px] font-medium text-white transition-colors px-3 py-1.5 rounded-md border border-blue-600 bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Save Code</span>
          </button>
        </div>
      )}

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
