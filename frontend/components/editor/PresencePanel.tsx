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
    <div className="flex items-center space-x-3 px-5 h-10 bg-background border-b border-border shadow-sm">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
        <div className="relative flex items-center justify-center">
          <Users className="w-3.5 h-3.5 text-primary" />
          <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
        </div>
        <span className="text-xs font-semibold text-primary tracking-wide">
          {users.length} {users.length === 1 ? 'User' : 'Users'} Online
        </span>
      </div>
      
      {activeFile && (
        <div className="relative ml-2" ref={dropdownRef}>
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="group flex items-center gap-2 text-[13px] font-medium text-foreground transition-all duration-300 px-3 py-1.5 rounded-md border border-border bg-muted/30 hover:bg-muted/80 shadow-sm hover:shadow"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]"></span>
              <span>{currentLanguage.name}</span>
            </div>
            <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-300 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showLanguageDropdown && (
            <div className="absolute top-full left-0 mt-2 w-40 bg-background border border-border rounded-lg shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-muted/80 ${
                    activeFile.language === lang.id ? 'text-primary font-semibold bg-primary/5' : 'text-muted-foreground hover:text-foreground'
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
        <div className="flex items-center space-x-3 mr-4">
          <button
            onClick={() => onSave?.(true)}
            className="group flex items-center space-x-1.5 text-[13px] font-medium text-foreground transition-all duration-300 px-3 py-1.5 rounded-md border border-border bg-muted/30 hover:bg-muted/80 shadow-sm hover:shadow"
          >
            <Code2 size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <span>Saved Codes</span>
          </button>

          <button
            onClick={() => onSave?.(false)}
            disabled={isSaving}
            className="flex items-center space-x-1.5 text-[13px] font-medium text-white transition-all duration-300 px-4 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-primary hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:transform-none"
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
