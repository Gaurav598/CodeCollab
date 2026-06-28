# Editor-First Layout Mockup

## Current Layout Analysis
```
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar (250px) │ Editor Area │ Right Panel (380px)            │
│                  │              │ - AI (default)                │
│ - File Tree     │ - Tabs       │ - Chat                        │
│ - Projects      │ - Editor     │ - Video                       │
│                  │ - Terminal   │                               │
└─────────────────────────────────────────────────────────────────┘
```

**Problems:**
- Right panel consumes 380px permanently (30%+ of screen on 1920px)
- AI is always visible, competing for attention
- Editor doesn't own the majority of screen real estate
- Collaboration features are given equal prominence to editing

## Proposed Layout: Editor First
```
┌─────────────────────────────────────────────────────────────────┐
│ Activity Bar │ Sidebar │         Editor Area (75-85%)         │
│ (48px)       │ (240px) │                                     │
│              │         │ ┌─────────────────────────────────┐ │
│ ┌──────────┐ │ ┌─────┐ │ │ Status Bar (24px)               │ │
│ │ Explorer │ │ │File │ │ │ Branch: main  │  Ln 12, Col 34  │ │
│ ├──────────┤ │ │Tree │ │ └─────────────────────────────────┘ │
│ │ Search   │ │ ├─────┤ │                                     │
│ ├──────────┤ │ │Proj │ │ ┌─────────────────────────────────┐ │
│ │ Git      │ │ │ects│ │ │ Terminal (collapsible, 200px)    │ │
│ ├──────────┤ │ ├─────┤ │ │ $ npm run dev                   │ │
│ │ Collab   │ │ │Room │ │ │                                 │ │
│ └──────────┘ │ │Info │ │ └─────────────────────────────────┘ │
│              │ └─────┘ │                                     │
│              │         │                                     │
│              │         │ ┌─────────────────────────────────┐ │
│              │         │ │ AI Inline Panel (triggered)     │ │
│              │         │ │ ┌─────────────────────────────┐ │ │
│              │         │ │ │ Cmd+K: Ask anything...      │ │ │
│              │         │ │ │ [Refactor] [Explain] [Fix]  │ │ │
│              │         │ │ └─────────────────────────────┘ │ │
│              │         │ └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

Collapsible Chat Panel (Discord-style, 280px):
┌─────────────────────────────────────────────────────────────────┐
│ # general  │ @mentions  │ Settings                            │
├─────────────────────────────────────────────────────────────────┤
│ John: Hey, can you review this PR?                             │
│ Sarah: Sure, looking at it now                                  │
│ You: I'll push the fixes in a minute                            │
├─────────────────────────────────────────────────────────────────┤
│ [Message input...]                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Key Changes

### 1. Editor Dominance (75-85% of screen)
- Remove permanent right panel
- Editor expands to fill available space
- Terminal becomes collapsible bottom panel (like VS Code)
- AI is inline/overlay, not permanent sidebar

### 2. Activity Bar (48px, VS Code-style)
- Vertical icon bar on far left
- Collapsible sidebar panels
- Icons: Explorer, Search, Git, Collab, Extensions, Settings
- Single click to toggle sidebar visibility

### 3. Sidebar (240px, collapsible)
- File tree (Explorer)
- Project selector
- Room info
- Can be hidden completely via Activity Bar

### 4. AI Interaction (Cursor-like)
- **Cmd+K** opens inline chat at cursor
- **Cmd+L** opens chat panel in sidebar
- **Cmd+I** triggers inline autocomplete
- No permanent AI panel - appears on demand
- Ghost text for suggestions
- Diff preview for refactoring

### 5. Chat (Discord-like)
- Collapsible right panel (280px)
- Channel-based: #general, #random, #code-review
- @mention highlighting
- Threaded conversations
- Voice/video indicator in header
- Toggle via icon or Cmd+Shift+C

### 6. Status Bar (24px)
- Git branch
- Cursor position
- Language mode
- Encoding
- Connection status Yjs/WebRTC
- AI provider status

## Responsive Behavior

### Large Screens (1920px+)
```
Activity Bar (48px) + Sidebar (240px) + Editor (75%) + Chat (280px, optional)
```

### Medium Screens (1280px - 1919ppx)
```
Activity Bar (48px) + Sidebar (200px) + Editor (80%)
Chat collapses to icon, opens as overlay
```

### Small Screens (< 1280px)
```
Activity Bar (48px) + Editor (95%)
Sidebar collapses to icons
Chat hidden, opens as modal
```

## Component Hierarchy (Visual Priority)

1. **Editor** (highest contrast, largest area)
2. **Tabs** (high visibility, clear active state)
3. **Status Bar** (always visible, low visual weight)
4. **Activity Bar** (icons only, subtle)
5. **Sidebar** (medium contrast, collapsible)
6. **Terminal** (low contrast, collapsible)
7. **AI Inline** (overlay, high contrast when active)
8. **Chat Panel** (medium contrast, collapsible)

## Information Architecture

### Primary Navigation
- File tree (always accessible via Activity Bar)
- Tab switching (keyboard: Cmd+1, Cmd+2, etc.)
- Command Palette (Cmd+Shift+P)

### Secondary Navigation
- Search (Cmd+Shift+F)
- Git panel (Activity Bar)
- Collaboration panel (Activity Bar)

### Tertiary Navigation
- Settings (Cmd+,)
- Extensions (Activity Bar)
- Chat channels (when panel open)

## Accessibility Considerations

- **Keyboard Navigation**: Full keyboard support for all features
- **Focus Indicators**: Clear focus rings on all interactive elements
- **Color Contrast**: WCAG AA compliant (4.5:1 for text)
- **Screen Readers**: Proper ARIA labels on all icons and panels
- **Reduced Motion**: Respect prefers-reduced-motion
- **Text Scaling**: Support 100%-200% zoom without breaking layout
