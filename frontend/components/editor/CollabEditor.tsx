'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useYjsDoc } from '../../hooks/useYjsDoc';
import { useAwareness } from '../../hooks/useAwareness';
import { RemoteCursors } from './RemoteCursors';
import { PresencePanel } from './PresencePanel';
import { ExecutionPanel } from '../workspace/ExecutionPanel';

interface CollabEditorProps {
  roomId: string;
}

export function CollabEditor({ roomId }: CollabEditorProps) {
  const activeFileId = useWorkspaceStore(state => state.activeTabId);
  const openFiles = useWorkspaceStore(state => state.openTabs);
  
  const activeFile = openFiles.find(f => f.id === activeFileId);
  
  const { doc, provider, connected } = useYjsDoc(roomId, activeFileId);
  const users = useAwareness(provider);
  
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const getCode = useCallback(() => {
    if (doc) {
      return doc.getText('monaco').toString();
    }
    return editorRef.current?.getValue() ?? '';
  }, [doc]);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Set up local cursor tracking for awareness
    editor.onDidChangeCursorPosition((e) => {
      if (provider) {
        provider.awareness.setLocalStateField('cursor', {
          line: e.position.lineNumber,
          ch: e.position.column
        });
      }
    });

    editor.onDidChangeCursorSelection((e) => {
      if (provider) {
        provider.awareness.setLocalStateField('selection', {
          startLineNumber: e.selection.startLineNumber,
          startColumn: e.selection.startColumn,
          endLineNumber: e.selection.endLineNumber,
          endColumn: e.selection.endColumn
        });
      }
    });
  };

  useEffect(() => {
    if (!editorRef.current || !doc || !provider) return;

    // The shared text type
    const type = doc.getText('monaco');
    
    // Create the binding
    bindingRef.current = new MonacoBinding(
      type,
      editorRef.current.getModel()!,
      new Set([editorRef.current]),
      provider.awareness
    );

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [doc, provider]);

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900">
        Select a file to start editing
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1e1e1e]">
      <PresencePanel users={users} />
      
      {!connected && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs py-1 px-4 text-center">
          Connecting to sync service...
        </div>
      )}
      
      <div className="flex-1 relative">
        <Editor
          theme="vs-dark"
          language={activeFile.language}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16 }
          }}
        />
        
        {/* Render remote cursor decorations */}
        <RemoteCursors editor={editorRef.current} users={users} />
      </div>

      <ExecutionPanel
        fileId={activeFile.id}
        language={activeFile.language}
        getCode={getCode}
        disabled={!connected}
      />
    </div>
  );
}
