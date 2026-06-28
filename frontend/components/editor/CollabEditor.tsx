'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';
import { renameFile, updateFileContent, getFileContent } from '@/services/workspaceService';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useYjsDoc } from '../../hooks/useYjsDoc';
import { useAwareness } from '../../hooks/useAwareness';
import { RemoteCursors } from './RemoteCursors';
import { PresencePanel } from './PresencePanel';
import { ExecutionPanel } from '../workspace/ExecutionPanel';
import { requestAutocomplete } from '@/services/aiService';
import { useThemeStore } from '@/store/themeStore';
import { useModalStore } from '@/store/modalStore';
import { useWebRTCStore } from '@/store/webrtcStore';
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
  const updateTabLanguage = useWorkspaceStore(state => state.updateTabLanguage);
  
  const openFileIds = React.useMemo(() => openFiles.map(f => f.id), [openFiles]);
  const { doc, provider, connected } = useYjsDoc(roomId, activeFileId, openFileIds);
  const users = useAwareness(provider);
  const isRemoteScreenSharing = useWebRTCStore(state => state.isRemoteScreenSharing);
  const isLocalScreenSharing = useWebRTCStore(state => state.isScreenSharing);
  const remoteScreenStream = useWebRTCStore(state => state.remoteScreenStream);
  const isScreenSplit = isRemoteScreenSharing || isLocalScreenSharing;
  
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const editorDisposablesRef = useRef<monaco.IDisposable[]>([]);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const providerRef = useRef(provider);
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteAbortControllerRef = useRef<AbortController | null>(null);
  const autocompleteCacheRef = useRef<Map<string, string[]>>(new Map());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedContent = useRef<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    providerRef.current = provider;
  }, [provider]);

  const handleLanguageChange = useCallback(async (language: string) => {
    if (!activeFile) return;
    try {
      await renameFile(activeFile.id, activeFile.path, language);
      updateTabLanguage(activeFile.id, language);
    } catch (err) {
      console.error('Failed to update language', err);
    }
  }, [activeFile, updateTabLanguage]);

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
    editorDisposablesRef.current.forEach(disposable => disposable.dispose());
    editorDisposablesRef.current = [];
    editorRef.current = editor;

    const cursorDisposable = editor.onDidChangeCursorPosition((e) => {
      if (providerRef.current) {
        providerRef.current.awareness.setLocalStateField('cursor', {
          line: e.position.lineNumber,
          ch: e.position.column
        });
      }
    });

    const selectionDisposable = editor.onDidChangeCursorSelection((e) => {
      if (providerRef.current) {
        providerRef.current.awareness.setLocalStateField('selection', {
          startLineNumber: e.selection.startLineNumber,
          startColumn: e.selection.startColumn,
          endLineNumber: e.selection.endLineNumber,
          endColumn: e.selection.endColumn
        });
      }
    });

    editorDisposablesRef.current = [cursorDisposable, selectionDisposable];
  };

  useEffect(() => {
    return () => {
      editorDisposablesRef.current.forEach(disposable => disposable.dispose());
      editorDisposablesRef.current = [];
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save logic
  useEffect(() => {
    if (!editorRef.current || !activeFile) return;

    const editor = editorRef.current;
    
    const disposable = editor.onDidChangeModelContent(() => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          if (!hasLoadedContent.current.has(activeFile.id)) return;
          const code = editor.getModel()?.getValue();
          if (code !== undefined) {
             await updateFileContent(activeFile.id, code);
          }
        } catch (err) {
          console.error("Auto-save failed", err);
        }
      }, 1000); // 1 second debounce
    });

    return () => disposable.dispose();
  }, [activeFile]);

  useEffect(() => {
    if (!editorRef.current || !doc || !provider || !activeFile) return;

    // The shared text type
    const type = doc.getText('monaco');
    
    // Create the binding
    bindingRef.current = new MonacoBinding(
      type,
      editorRef.current.getModel()!,
      new Set([editorRef.current]),
      provider.awareness
    );

    // Initial load from DB if completely empty
    const initializeContent = async () => {
       if (hasLoadedContent.current.has(activeFile.id)) return;
       
       if (type.length === 0) {
         try {
           const fileEntry = await getFileContent(activeFile.id);
           if (fileEntry.content && type.length === 0) {
             // Handle case where sync-service saved a base64 Yjs update (from the previous behavior)
             let initialText = fileEntry.content;
             try {
                // Quick heuristic: If it looks like a base64 string without spaces, don't just insert it blindly as text,
                // actually we shouldn't insert base64 strings if the architecture moved to raw text.
                // We'll insert it as raw text since backend patchFile accepts raw text now.
             } catch(e) {}
             type.insert(0, initialText);
           }
         } catch (err) {
           console.error("Failed to load initial content", err);
         }
       }
       hasLoadedContent.current.add(activeFile.id);
    };
    
    initializeContent();

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [doc, provider, activeFile]);

  useEffect(() => {
    if (!monacoApi || !activeFile) return;

    const supported = new Set(['java', 'cpp', 'c++', 'python', 'javascript', 'typescript', 'go']);
    if (!supported.has(activeFile.language)) return;

    const disposable = monacoApi.languages.registerInlineCompletionsProvider(activeFile.language, {
      provideInlineCompletions: async (model: monaco.editor.ITextModel, position: monaco.Position) => {
        if (autocompleteTimerRef.current) {
          clearTimeout(autocompleteTimerRef.current);
        }
        if (autocompleteAbortControllerRef.current) {
          autocompleteAbortControllerRef.current.abort();
        }

        const textUntilCursor = model.getValueInRange({
          startLineNumber: Math.max(1, position.lineNumber - 80),
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // Check cache first
        if (autocompleteCacheRef.current.has(textUntilCursor)) {
          const cachedSuggestions = autocompleteCacheRef.current.get(textUntilCursor)!;
          return {
            items: cachedSuggestions.map((suggestion) => ({
              insertText: suggestion,
              range: new monacoApi.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            })),
            dispose: () => undefined,
          };
        }

        const abortController = new AbortController();
        autocompleteAbortControllerRef.current = abortController;

        await new Promise((resolve) => {
          autocompleteTimerRef.current = setTimeout(resolve, 350);
        });

        if (abortController.signal.aborted) {
          return { items: [], dispose: () => undefined };
        }

        try {
          const response = await requestAutocomplete({
            fileId: activeFile.id,
            projectId: activeFile.projectId,
            language: activeFile.language,
            path: activeFile.path,
            code: model.getValue(),
            selection: textUntilCursor,
            contextFileIds: openFiles.filter(file => file.id !== activeFile.id).map(file => file.id).slice(0, 4),
          }, abortController.signal);

          // Cache the response
          if (response.suggestions.length > 0) {
            autocompleteCacheRef.current.set(textUntilCursor, response.suggestions);
            // Optional: limit cache size to prevent memory leaks over long sessions
            if (autocompleteCacheRef.current.size > 100) {
              const firstKey = autocompleteCacheRef.current.keys().next().value;
              if (firstKey) autocompleteCacheRef.current.delete(firstKey);
            }
          }

          return {
            items: response.suggestions.map((suggestion) => ({
              insertText: suggestion,
              range: new monacoApi.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            })),
            dispose: () => undefined,
          };
        } catch (err: any) {
          if (err.name === 'AbortError') {
             return { items: [], dispose: () => undefined };
          }
          return { items: [], dispose: () => undefined };
        }
      },
      disposeInlineCompletions: () => undefined,
    });

    return () => {
      disposable.dispose();
      if (autocompleteTimerRef.current) {
        clearTimeout(autocompleteTimerRef.current);
        autocompleteTimerRef.current = null;
      }
      if (autocompleteAbortControllerRef.current) {
        autocompleteAbortControllerRef.current.abort();
        autocompleteAbortControllerRef.current = null;
      }
    };
  }, [monacoApi, activeFile, openFiles]);

  const handleDownload = useCallback(() => {
    const code = getCode();
    if (!activeFile) return;
    const filename = activeFile.path.split('/').pop() || 'code';
    const blob = new Blob([code], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getCode, activeFile]);

  const handleExplicitSave = useCallback(async () => {
    if (!activeFile) return;
    const code = getCode();
    try {
      setIsSaving(true);
      await updateFileContent(activeFile.id, code);
      setToastMessage("Code saved successfully");
      setTimeout(() => setToastMessage(""), 3000);
    } catch (error) {
      setToastMessage("Failed to save code");
      setTimeout(() => setToastMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [activeFile, getCode]);

  useEffect(() => {
    window.addEventListener("collabcode:download-active-file", handleDownload);
    return () => window.removeEventListener("collabcode:download-active-file", handleDownload);
  }, [handleDownload]);

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
    <div className="flex min-h-0 flex-1 bg-background relative">
      {toastMessage && (
        <div className={`absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md shadow-lg backdrop-blur-sm transition-all duration-300 text-sm font-medium ${toastMessage.includes("Failed") ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20"}`}>
          {toastMessage}
        </div>
      )}
      
      <div className="flex min-w-0 flex-1 flex-col">
        <PresencePanel users={users} activeFile={activeFile} onLanguageChange={handleLanguageChange} onSave={handleExplicitSave} isSaving={isSaving} />
        
        {/* Screen share split layout */}
        <div className={`flex min-h-0 flex-1 ${isScreenSplit ? 'flex-row' : 'flex-col'}`}>
          {/* Code Editor */}
          <div className={`relative flex flex-col ${isScreenSplit ? 'w-1/2 border-r border-border' : 'flex-1'} transition-all duration-300`}>
            <div className="relative flex-1">
              <Editor
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                language={activeFile.language}
                path={activeFile.path}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: !isScreenSplit },
                  fontSize: 14,
                  lineHeight: 22,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace",
                  cursorBlinking: "smooth",
                  cursorStyle: "line",
                  renderLineHighlight: "all",
                  bracketPairColorization: { enabled: true },
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  inlineSuggest: { enabled: true },
                  padding: { top: 16, bottom: 16 }
                }}
              />
              <RemoteCursors editor={editorRef.current} users={users} />
            </div>

            {!isScreenSplit && (
              <ExecutionPanel
                fileId={activeFile.id}
                language={activeFile.language}
                getCode={getCode}
                disabled={!connected}
              />
            )}
          </div>

          {/* Shared Screen Panel */}
          {isScreenSplit && (
            <div className="relative flex w-1/2 flex-col bg-zinc-950 transition-all duration-300">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-zinc-900">
                <span className="text-xs font-medium text-zinc-300">
                  {isLocalScreenSharing ? '🖥️ You are sharing your screen' : '🖥️ Screen Share'}
                </span>
                {isRemoteScreenSharing && (
                  <span className="text-xs text-zinc-400">Participant is sharing</span>
                )}
              </div>
              <div className="flex-1 flex items-center justify-center p-3">
                {remoteScreenStream ? (
                  <video
                    autoPlay
                    playsInline
                    ref={el => { if (el) el.srcObject = remoteScreenStream; }}
                    className="max-w-full max-h-full rounded-lg shadow-xl object-contain"
                  />
                ) : (
                  <div className="text-zinc-500 text-sm text-center">
                    <p>Your screen is visible to others.</p>
                    <p className="text-xs mt-1 text-zinc-600">Stop sharing to return to full editor.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
