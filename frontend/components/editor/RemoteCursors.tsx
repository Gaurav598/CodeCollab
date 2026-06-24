import React, { useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { UserAwareness } from '../../hooks/useAwareness';

interface RemoteCursorsProps {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  users: UserAwareness[];
}

export function RemoteCursors({ editor, users }: RemoteCursorsProps) {
  useEffect(() => {
    if (!editor) return;

    let decorationsCollection: monaco.editor.IEditorDecorationsCollection | null = null;
    
    const updateDecorations = () => {
      const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];

      users.forEach(user => {
        // Skip users without cursor position
        if (!user.cursor) return;

        // Cursor decoration
        newDecorations.push({
          range: new monaco.Range(user.cursor.line, user.cursor.ch, user.cursor.line, user.cursor.ch),
          options: {
            className: `remote-cursor remote-cursor-${user.id}`,
            hoverMessage: { value: user.name },
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          }
        });

        // Selection decoration (if different from cursor)
        if (user.selection && 
            (user.selection.startLineNumber !== user.selection.endLineNumber || 
             user.selection.startColumn !== user.selection.endColumn)) {
          newDecorations.push({
            range: new monaco.Range(
              user.selection.startLineNumber,
              user.selection.startColumn,
              user.selection.endLineNumber,
              user.selection.endColumn
            ),
            options: {
              className: `remote-selection remote-selection-${user.id}`,
              stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            }
          });
        }
      });

      if (!decorationsCollection) {
        decorationsCollection = editor.createDecorationsCollection(newDecorations);
      } else {
        decorationsCollection.set(newDecorations);
      }
    };

    updateDecorations();

    // Dynamically inject CSS rules for user colors if they don't exist
    users.forEach(user => {
      const styleId = `remote-cursor-style-${user.id}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          .remote-cursor-${user.id} {
            border-left: 2px solid ${user.color};
            position: relative;
            z-index: 10;
          }
          .remote-cursor-${user.id}::after {
            content: "${user.name}";
            position: absolute;
            top: -1.2em;
            left: 0;
            background-color: ${user.color};
            color: #fff;
            font-size: 10px;
            padding: 2px 4px;
            border-radius: 2px;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
          }
          .remote-cursor-${user.id}:hover::after {
            opacity: 1;
          }
          .remote-selection-${user.id} {
            background-color: ${user.color}40; /* 40 hex is 25% opacity */
          }
        `;
        document.head.appendChild(style);
      }
    });

    return () => {
      if (decorationsCollection) {
        decorationsCollection.clear();
      }
    };
  }, [editor, users]);

  return null; // This is a logic-only component, it renders via Monaco decorations
}
