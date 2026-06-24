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
import { requestAutocomplete } from '@/services/aiService';
import { useThemeStore } from '@/store/themeStore';
import { WorkspaceRightPanel } from '@/components/workspace/WorkspaceRightPanel';

interface CollabEditorProps {
  roomId: string;
}

export function CollabEditor({ roomId }: CollabEditorProps) {
  const monacoApi = useMonaco();
  const activeFileId = useWorkspaceStore(state => state.activeTabId);
  const openFiles = useWorkspaceStore(state => state.openTabs);
  
  const activeFile = openFiles.find(f => f.id === activeFileId);
  const theme = useThemeStore(state => state.theme);
  
  const { doc, provider, connected } = useYjsDoc(roomId, activeFileId);
  const users = useAwareness(provider);
  
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const providerRef = useRef(provider);
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    providerRef.current = provider;
  }, [provider]);

  const getCode = useCallback(() => {
    if (doc) {
      return doc.getText('monaco').toString();
    }
    return editorRef.current?.getValue() ?? '';
  }, [doc]);

  const getSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = editor?.getSelection();
    const model = editor?.getModel();
    if (!selection || !model) return '';
    return model.getValueInRange(selection);
  }, []);

  const applyPreview = useCallback((code: string) => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model || !code) return;
    const selection = editor.getSelection();
    editor.executeEdits('ai-refactor-preview', [
      {
        range: selection && !selection.isEmpty() ? selection : model.getFullModelRange(),
        text: code,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  }, []);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Set up local cursor tracking for awareness
    editor.onDidChangeCursorPosition((e) => {
      if (providerRef.current) {
        providerRef.current.awareness.setLocalStateField('cursor', {
          line: e.position.lineNumber,
          ch: e.position.column
        });
      }
    });

    editor.onDidChangeCursorSelection((e) => {
      if (providerRef.current) {
        providerRef.current.awareness.setLocalStateField('selection', {
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

  useEffect(() => {
    if (!monacoApi || !activeFile) return;

    const supported = new Set(['java', 'cpp', 'c++', 'python', 'javascript', 'typescript', 'go']);
    if (!supported.has(activeFile.language)) return;

    const disposable = monacoApi.languages.registerInlineCompletionsProvider(activeFile.language, {
      provideInlineCompletions: async (model: monaco.editor.ITextModel, position: monaco.Position) => {
        if (autocompleteTimerRef.current) {
          clearTimeout(autocompleteTimerRef.current);
        }
        await new Promise((resolve) => {
          autocompleteTimerRef.current = setTimeout(resolve, 350);
        });
        const textUntilCursor = model.getValueInRange({
          startLineNumber: Math.max(1, position.lineNumber - 80),
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });
        try {
          const response = await requestAutocomplete({
            fileId: activeFile.id,
            projectId: activeFile.projectId,
            language: activeFile.language,
            path: activeFile.path,
            code: model.getValue(),
            selection: textUntilCursor,
            contextFileIds: openFiles.filter(file => file.id !== activeFile.id).map(file => file.id).slice(0, 4),
          });
          return {
            items: response.suggestions.map((suggestion) => ({
              insertText: suggestion,
              range: new monacoApi.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            })),
            dispose: () => undefined,
          };
        } catch {
          return { items: [], dispose: () => undefined };
        }
      },
      disposeInlineCompletions: () => undefined,
    });

    return () => disposable.dispose();
  }, [monacoApi, activeFile, openFiles]);

  if (!activeFile) {
    return (
      <div className="flex min-h-0 flex-1">
        <div className="flex flex-1 items-center justify-center bg-background text-muted-foreground">
          Select a file to start editing
        </div>
        <WorkspaceRightPanel
          roomId={roomId}
          activeFile={activeFile}
          openFiles={openFiles}
          getCode={getCode}
          getSelection={getSelection}
          applyPreview={applyPreview}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 bg-background">
      <div className="flex min-w-0 flex-1 flex-col">
        <PresencePanel users={users} />
        
        {!connected && (
          <div className="bg-amber-500/10 px-4 py-1 text-center text-xs text-amber-300">
            Connecting to sync service...
          </div>
        )}
        
        <div className="relative flex-1">
          <Editor
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            language={activeFile.language}
            path={activeFile.path}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              inlineSuggest: { enabled: true },
              padding: { top: 16 }
            }}
          />
          
          <RemoteCursors editor={editorRef.current} users={users} />
        </div>

        <ExecutionPanel
          fileId={activeFile.id}
          language={activeFile.language}
          getCode={getCode}
          disabled={!connected}
        />
      </div>
      <WorkspaceRightPanel
        roomId={roomId}
        activeFile={activeFile}
        openFiles={openFiles}
        getCode={getCode}
        getSelection={getSelection}
        applyPreview={applyPreview}
      />
    </div>
  );
}
