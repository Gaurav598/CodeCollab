'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';
import * as Y from 'yjs';
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
import { SavedCodesModal } from '../workspace/SavedCodesModal';
import { WebRTCConnectionHandler } from '../communication/WebRTCConnectionHandler';

interface CollabEditorProps {
  roomId: string;
  userRole?: string;
}

export function CollabEditor({ roomId, userRole = "editor" }: CollabEditorProps) {
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
  const localStream = useWebRTCStore(state => state.localStream);
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
  const [currentModelUri, setCurrentModelUri] = useState("");
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  useEffect(() => {
    providerRef.current = provider;
  }, [provider]);

  const handleLanguageChange = useCallback(async (language: string) => {
    if (!activeFile) return;
    try {
      await renameFile(activeFile.id, activeFile.path, language);
      updateTabLanguage(activeFile.id, language);
    } catch (error) {
      console.warn('Failed to change language:', error);
    }
  }, [activeFile, updateTabLanguage]);

  const getCode = useCallback(() => {
    return editorRef.current?.getModel()?.getValue() || '';
  }, []);

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

    setCurrentModelUri(editor.getModel()?.uri.toString() || "");
    const modelDisposable = editor.onDidChangeModel(() => {
      setCurrentModelUri(editor.getModel()?.uri.toString() || "");
    });

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

    editorDisposablesRef.current = [modelDisposable, cursorDisposable, selectionDisposable];
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

  useEffect(() => {
    if (!editorRef.current || !doc || !provider || !activeFile) return;

    // Wait until the editor has mounted the correct model for this file
    const currentModel = editorRef.current.getModel();
    if (!currentModel || (!currentModel.uri.path.endsWith(activeFile.id) && !currentModel.uri.path.endsWith(activeFile.path))) {
      return;
    }

    console.log(`\n================================`);
    console.log(`[STAGE 3] MONACO MODEL CREATED`);
    console.log(`[STAGE 3] Model URI: ${currentModel.uri.toString()}`);
    console.log(`================================\n`);

    // The shared text type
    const type = doc.getText('monaco');
    console.log(`[STAGE 2] Y.Text created/retrieved for ${activeFile.id}`);

    // Observer registration for Stage 2
    const observer = (event: Y.YTextEvent, transaction: Y.Transaction) => {
      if (!transaction.local) return; // ONLY AUTO-SAVE LOCAL CHANGES!

      // Debounced Auto-Save (Fixes code loss on reload)
      if (userRole === "viewer") return; // Viewers do not have permission to save

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updateFileContent(activeFile.id, type.toString());
        } catch (e) {
          console.warn("Auto-save failed", e);
        }
      }, 1000);
    };
    type.observe(observer);
    console.log(`[STAGE 2] Observer registered for ${activeFile.id}`);

    // Create the binding
    const binding = new MonacoBinding(
      type,
      currentModel,
      new Set([editorRef.current]),
      provider.awareness
    );

    console.log(`[STAGE 3] MonacoBinding created for ${activeFile.id}`);

    // Monkey-patch destroy to be idempotent and swallow errors from y-monaco's double-destroy bug
    const originalDestroy = binding.destroy.bind(binding);
    let isDestroyed = false;
    binding.destroy = () => {
      if (isDestroyed) return;
      isDestroyed = true;
      console.log(`[STAGE 3] MonacoBinding destroyed for ${activeFile.id}`);
      try {
        originalDestroy();
      } catch (e) {
        // ignore yjs internal unobserve errors
      }
    };

    bindingRef.current = binding;

    // Initial load from DB if completely empty
    const initializeContent = async () => {
      if (hasLoadedContent.current.has(activeFile.id)) return;

      // Wait for Yjs to sync state across clients first
      if (!provider.synced) {
        await new Promise<void>(resolve => {
          const onSync = (isSynced: boolean) => {
            if (isSynced) {
              provider.off('sync', onSync);
              resolve();
            }
          };
          provider.on('sync', onSync);
          // Wait for actual sync, no fallback timeout that causes premature fetch
        });
      }

      if (type.length === 0) {
        try {
          const fileEntry = await getFileContent(activeFile.id);
          if (fileEntry.content && type.length === 0) {
            type.insert(0, fileEntry.content);
          }
        } catch (err: any) {
          if (err?.status === 404) {
            console.warn(`File ${activeFile.id} not found on server. Closing local tab.`);
            useWorkspaceStore.getState().closeTab(activeFile.id);
          } else {
            console.warn("Fetch Error during room initialization:", err);
          }
        }
      }
      hasLoadedContent.current.add(activeFile.id);
    };

    initializeContent();

    return () => {
      console.log(`[STAGE 2] Observer unregistered for ${activeFile.id}`);
      type.unobserve(observer);
      if (bindingRef.current) {
        try {
          bindingRef.current.destroy();
        } catch (e) {
          // Ignore yjs 'Tried to remove event handler that doesn't exist' error
          // This happens in React strict mode or during rapid file switching
        }
        bindingRef.current = null;
      }
    };
  }, [doc, provider, activeFile, monacoApi, currentModelUri]);

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
            roomId: roomId,
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

    let filename = activeFile.path.split('/').pop() || 'code';

    const extMap: Record<string, string> = {
      cpp: '.cpp',
      c: '.c',
      java: '.java',
      javascript: '.js',
      python: '.py'
    };

    const ext = activeFile.language ? extMap[activeFile.language] : '';
    if (ext && !filename.toLowerCase().endsWith(ext)) {
      filename += ext;
    }

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

  const [showSavedCodes, setShowSavedCodes] = useState(false);

  const handleExplicitSave = useCallback(async (isViewSavedCodes: boolean = false) => {
    if (isViewSavedCodes) {
      setShowSavedCodes(true);
      return;
    }

    if (!activeFile) return;
    const code = getCode();
    try {
      setIsSaving(true);
      // Also update the room's temporary collaborative state in MongoDB just in case
      await updateFileContent(activeFile.id, code);
      // explicitly save to user's personal saved codes
      const { saveExplicitCode } = await import('@/services/workspaceService');
      await saveExplicitCode(roomId, activeFile.path, activeFile.language, code);

      setToastMessage("Your code is now saved 😃");
      setTimeout(() => setToastMessage(""), 3000);
    } catch (error: any) {
      setToastMessage("Failed to save code");
      setTimeout(() => setToastMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [activeFile, getCode, roomId]);

  const handleRestoreSavedCode = useCallback((savedCode: any) => {
    // 1. Close modal
    setShowSavedCodes(false);

    // 2. Overwrite current Yjs document with saved code
    if (doc && provider) {
      const type = doc.getText('monaco');
      type.delete(0, type.length);
      type.insert(0, savedCode.code);
      setToastMessage("Code restored successfully!");
      setTimeout(() => setToastMessage(""), 3000);
    }
  }, [doc, provider]);

  useEffect(() => {
    const handleOpenSavedCodes = () => setShowSavedCodes(true);
    window.addEventListener("collabcode:download-active-file", handleDownload);
    window.addEventListener("collabcode:open-saved-codes", handleOpenSavedCodes);
    return () => {
      window.removeEventListener("collabcode:download-active-file", handleDownload);
      window.removeEventListener("collabcode:open-saved-codes", handleOpenSavedCodes);
    };
  }, [handleDownload]);

  if (!activeFile) {
    return (
      <div className="flex min-h-0 flex-1">
        <div className="flex flex-1 items-center justify-center bg-background text-muted-foreground">
          Select a file to start editing
        </div>
        <WorkspaceRightPanel
          roomId={roomId}
          userRole={userRole}
          users={users}
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

      <WebRTCConnectionHandler roomId={roomId} userRole={userRole} />

      <div className="flex min-w-0 flex-1 flex-col">
        <PresencePanel 
          users={users} 
          activeFile={activeFile} 
          onLanguageChange={handleLanguageChange} 
          onSave={handleExplicitSave} 
          isSaving={isSaving}
          isRightPanelOpen={isRightPanelOpen}
          onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
        />

        <SavedCodesModal
          isOpen={showSavedCodes}
          onClose={() => setShowSavedCodes(false)}
          onRestore={handleRestoreSavedCode}
        />

        {/* Screen share split layout */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className={`flex min-h-0 flex-1 ${isScreenSplit ? 'flex-row' : 'flex-col'}`}>
            {/* Code Editor */}
            <div className={`relative flex flex-col ${isScreenSplit ? 'w-[60%] border-r border-border' : 'flex-1'} min-h-0 transition-all duration-300`}>
              <div className="relative flex-1 min-h-0">
                <Editor
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  language={activeFile.language?.toLowerCase() || 'javascript'}
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
                    padding: { top: 16, bottom: 16 },
                    readOnly: userRole === "viewer"
                  }}
                />
                <RemoteCursors editor={editorRef.current} users={users} />
              </div>
            </div>

            {/* Shared Screen Panel */}
            {isScreenSplit && (
              <div className="relative flex w-[40%] flex-col bg-background min-h-0 transition-all duration-300">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted shrink-0">
                  <span className="text-xs font-medium text-foreground truncate">
                    {isLocalScreenSharing ? '🖥️ You are sharing' : '🖥️ Screen Share'}
                  </span>
                  {isRemoteScreenSharing && (
                    <span className="text-xs text-muted-foreground truncate">Participant is sharing</span>
                  )}
                </div>
                <div className="flex-1 flex min-h-0 min-w-0 items-center justify-center p-3 bg-muted/20 overflow-hidden relative">
                  {isLocalScreenSharing && localStream ? (
                    <div className="w-full h-full relative flex flex-col items-center justify-center min-h-0">
                      <video 
                        ref={(el) => { if (el && el.srcObject !== localStream) el.srcObject = localStream; }}
                        autoPlay
                        playsInline
                        muted
                        className="max-w-full max-h-full object-contain rounded-md shadow-xl border border-border bg-black"
                      />
                      <div className="absolute bottom-4 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-border flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
                         <span className="text-xs font-medium whitespace-nowrap">Your screen is visible</span>
                      </div>
                    </div>
                  ) : remoteScreenStream ? (
                    <div className="w-full h-full relative flex flex-col items-center justify-center min-h-0">
                      <video
                        autoPlay
                        playsInline
                        ref={el => { if (el && el.srcObject !== remoteScreenStream) el.srcObject = remoteScreenStream; }}
                        className="max-w-full max-h-full rounded-lg shadow-xl object-contain bg-black border border-border"
                      />
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm text-center">
                      <p className="font-semibold text-foreground">Your screen is visible to others.</p>
                      <p className="text-xs mt-1">Stop sharing to return to full editor.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {activeFile && (
            <ExecutionPanel
              fileId={activeFile.id}
              language={activeFile.language}
              getCode={getCode}
              disabled={!connected}
            />
          )}
        </div>
      </div>
      {isRightPanelOpen && (
        <WorkspaceRightPanel
          roomId={roomId}
          userRole={userRole}
          users={users}
          activeFile={activeFile}
          openFiles={openFiles}
          getCode={getCode}
          getSelection={getSelection}
          applyPreview={applyPreview}
        />
      )}
    </div>
  );
}
