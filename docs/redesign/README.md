# CollabCode Redesign: Editor First, Collaboration Second, AI Third

## Overview

This redesign reimagines CollabCode around the principle that **the editor must own the screen**. AI and collaboration features are powerful but should never compete with the core editing experience.

## Design Philosophy

### Editor First
- Editor occupies 75-85% of screen real estate
- All navigation is secondary to editing
- Keyboard-first interaction model
- VS Code-familiar patterns for developers

### Collaboration Second
- Chat is accessible but not intrusive
- Voice/video available on demand
- Presence indicators subtle but visible
- Discord-like chat experience

### AI Third
- AI appears when needed, disappears when not
- Cursor-like inline interactions
- No permanent AI panel
- Ghost text for suggestions
- Diff preview for refactoring

## Mockup Documents

### 1. [Editor First Layout](./01-editor-first-layout.md)
Complete layout redesign with:
- Activity Bar (48px, VS Code-style)
- Collapsible Sidebar (240px)
- Editor Area (75-85% of screen)
- Collapsible Terminal (200px)
- Collapsible Chat Panel (280px)
- Status Bar (24px)

### 2. [Navigation Hierarchy](./02-navigation-hierarchy.md)
Navigation system with:
- Command Palette (Cmd+Shift+P)
- Quick Open (Cmd+P)
- Tab Switching (Cmd+1, Cmd+2, etc.)
- Activity Bar panels
- Context menus
- Complete keyboard shortcut reference

### 3. [AI Interaction (Cursor-style)](./03-ai-interaction-cursor-style.md)
AI interaction patterns:
- Inline Autocomplete (Cmd+I)
- Inline Chat (Cmd+K)
- AI Chat Panel (Cmd+L)
- Quick Actions Menu (Cmd+Shift+A)
- Diff Preview for refactoring
- Context awareness indicators

### 4. [Chat Interface (Discord-style)](./04-chat-interface-discord-style.md)
Chat interface design:
- Channel-based organization
- Threaded conversations
- @mention highlighting
- Voice/video integration
- Code sharing from editor
- Message types (text, code, files, mentions)

### 5. [Workspace Layout (VS Code-style)](./05-workspace-vscode-style.md)
Complete workspace layout:
- Title Bar, Tab Bar, Breadcrumb
- Monaco Editor with minimap
- Terminal with multiple tabs
- Status Bar with git, position, language
- Split editor views
- Zen Mode
- Complete keyboard shortcuts

### 6. [Component Structure & Visual System](./06-component-structure-visual-system.md)
Component architecture:
- Component hierarchy and props
- Color palette (dark/light themes)
- Typography system
- Spacing scale
- Component states
- Accessibility features
- Responsive breakpoints

## Key Changes from Current Design

### Before
```
Sidebar (250px) │ Editor │ Right Panel (380px, permanent)
                         │ - AI (default)
                         │ - Chat
                         │ - Video
```

### After
```
Activity Bar │ Sidebar │ Editor (75-85%) │ Chat (280px, collapsible)
(48px)       │ (240px)  │                │
                       │ - Terminal (200px, collapsible)
                       │ - AI (inline, on-demand)
```

## Implementation Considerations

### Phase 1: Layout Restructuring
1. Create Activity Bar component
2. Restructure Sidebar to be collapsible
3. Remove permanent right panel
4. Make Terminal collapsible bottom panel
5. Add Status Bar

### Phase 2: AI Integration
1. Implement inline autocomplete (ghost text)
2. Add Cmd+K inline chat
3. Create AI chat panel (Cmd+L)
4. Build quick actions menu (Cmd+Shift+A)
5. Add diff preview for refactoring

### Phase 3: Chat Redesign
1. Implement channel-based chat
2. Add threaded conversations
3. Integrate @mention highlighting
4. Add voice/video controls
5. Implement code sharing from editor

### Phase 4: Navigation & Polish
1. Implement Command Palette
2. Add Quick Open
3. Implement keyboard shortcuts
4. Add context menus
5. Polish visual design

## Accessibility

All designs include:
- WCAG AA compliant color contrast (4.5:1)
- Full keyboard navigation
- Screen reader support with ARIA labels
- Focus indicators on all interactive elements
- Respect for prefers-reduced-motion
- Support for 100%-200% text scaling

## Responsive Design

- **Large Screens (1920px+)**: Full layout with all panels
- **Medium Screens (1280px-1919px)**: Chat collapses to icon
- **Small Screens (<1280px)**: Sidebar collapses to icons, chat hidden

## Developer Productivity Features

- **Command Palette**: Quick access to all commands
- **Quick Open**: Fuzzy search through files
- **Keyboard Shortcuts**: Full keyboard support
- **Split Editor**: Work on multiple files simultaneously
- **Zen Mode**: Distraction-free editing
- **Git Integration**: Built-in version control
- **Terminal**: Integrated shell access

## Visual Consistency

- **Dark Theme**: VS Code-inspired dark theme
- **Light Theme**: Clean, high-contrast light theme
- **Typography**: Inter for UI, JetBrains Mono for code
- **Spacing**: Consistent 4px base unit
- **Borders**: Subtle 1px borders
- **Shadows**: Minimal depth effects

## Next Steps

These mockups are ready for implementation. The recommended approach is:

1. **Review** mockups with stakeholders
2. **Create** design system components in code
3. **Implement** Phase 1 (Layout Restructuring)
4. **Test** with real users
5. **Iterate** based on feedback
6. **Proceed** to Phase 2 (AI Integration)

## Files

All mockup documents are located in `/docs/redesign/`:
- `01-editor-first-layout.md`
- `02-navigation-hierarchy.md`
- `03-ai-interaction-cursor-style.md`
- `04-chat-interface-discord-style.md`
- `05-workspace-vscode-style.md`
- `06-component-structure-visual-system.md`
- `README.md` (this file)
