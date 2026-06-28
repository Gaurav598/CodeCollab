# Component Structure & Visual System

## Component Architecture

### Layout Components

#### 1. WorkspaceLayout
```
WorkspaceLayout/
├── ActivityBar (48px, left edge)
├── Sidebar (240px, collapsible)
├── EditorArea (flexible, 75-85%)
│   ├── TitleBar (28px)
│   ├── TabBar (35px)
│   ├── Breadcrumb (24px)
│   ├── Editor (Monaco, flexible)
│   ├── Terminal (200px, collapsible)
│   └── StatusBar (24px)
└── ChatPanel (280px, collapsible, right edge)
```

**Props:**
- `roomCode: string`
- `userRole: 'owner' | 'editor' | 'viewer'`
- `theme: 'dark' | 'light'`

**State:**
- `sidebarVisible: boolean`
- `terminalVisible: boolean`
- `chatVisible: boolean`
- `activePanel: 'explorer' | 'search' | 'git' | 'collab' | 'extensions' | 'settings'`

#### 2. ActivityBar
```
ActivityBar/
├── ActivityButton (icon, label, shortcut, active)
├── NotificationBadge (count)
└── Tooltip (on hover)
```

**Icons:**
- Explorer (📁)
- Search (🔍)
- Git (🌿)
- Collab (👥)
- Extensions (🧩)
- Settings (⚙️)

#### 3. Sidebar
```
Sidebar/
├── ExplorerPanel
│   ├── FileTree
│   ├── OutlineView
│   └── BreadcrumbNavigation
├── SearchPanel
│   ├── SearchInput
│   ├── SearchFilters
│   └── SearchResults
├── GitPanel
│   ├── BranchSelector
│   ├── ChangesList
│   └── StagedChangesList
├── CollabPanel
│   ├── RoomInfo
│   ├── OnlineUsers
│   └── ActivityFeed
├── ExtensionsPanel
│   ├── ExtensionList
│   └── ExtensionSettings
└── SettingsPanel
    ├── SettingsList
    └── SettingItem
```

#### 4. EditorArea
```
EditorArea/
├── TitleBar
│   ├── AppTitle
│   ├── RoomCode
│   └── WindowControls
├── TabBar
│   ├── Tab (active, modified, hover)
│   ├── TabGroup
│   └── NewTabButton
├── Breadcrumb
│   ├── BreadcrumbSegment
│   └── BreadcrumbSeparator
├── Editor (Monaco)
│   ├── RemoteCursors
│   ├── InlineAI
│   └── Minimap
├── Terminal
│   ├── TerminalTabs
│   ├── TerminalContent
│   └── TerminalInput
└── StatusBar
    ├── StatusItem (git, position, encoding, language)
    └── ConnectionStatus
```

### AI Components

#### 1. InlineAI
```
InlineAI/
├── Autocomplete (ghost text)
├── InlineChat (Cmd+K)
│   ├── ChatInput
│   ├── QuickActions
│   ├── AIResponse
│   └── DiffPreview
└── AIActionsMenu (Cmd+Shift+A)
    ├── ActionCard
    └── ActionDescription
```

**States:**
- `idle` - No AI interaction
- `suggesting` - Showing ghost text
- `chatting` - Inline chat open
- `loading` - AI processing
- `error` - AI error state

#### 2. AIChatPanel
```
AIChatPanel/
├── ChatHeader
├── ConversationHistory
│   ├── UserMessage
│   ├── AssistantMessage
│   └── CodeBlock
├── ContextIndicator
└── ChatInput
```

**Props:**
- `activeFile: TabData | null`
- `openFiles: TabData[]`
- `getCode: () => string`
- `getSelection: () => string`
- `applyPreview: (code: string) => void`

### Collaboration Components

#### 1. ChatPanel
```
ChatPanel/
├── ChannelList
│   ├── TextChannel
│   ├── VoiceChannel
│   └── DirectMessage
├── ChannelHeader
├── MessageList
│   ├── TextMessage
│   ├── CodeMessage
│   ├── FileMessage
│   ├── MentionMessage
│   └── SystemMessage
├── MessageInput
│   ├── TextInput
│   ├── AttachmentButton
│   ├── EmojiPicker
│   └── VoiceRecordButton
└── VoicePanel
    ├── ParticipantList
    ├── VoiceControls
    └── VideoGrid
```

**States:**
- `collapsed` - Icon only
- `expanded` - Full panel
- `pinned` - Always visible

#### 2. PresencePanel
```
PresencePanel/
├── UserAvatar
├── UserName
├── UserStatus (online, away, offline)
└── CursorIndicator
```

#### 3. RemoteCursors
```
RemoteCursors/
├── CursorLabel
├── CursorLine
└── CursorSelection
```

### UI Components

#### 1. CommandPalette
```
CommandPalette/
├── CommandInput
├── CommandList
│   ├── RecentFiles
│   └── Commands
└── CommandItem
```

#### 2. QuickOpen
```
QuickOpen/
├── SearchInput
├── FileList
└── FileItem
```

#### 3. ContextMenu
```
ContextMenu/
├── MenuItem
├── MenuSeparator
└── MenuShortcut
```

#### 4. Toast
```
Toast/
├── ToastContent
├── ToastAction
└── ToastClose
```

## Visual System

### Color Palette (Dark Theme)

#### Primary Colors
```css
--background: #1e1e1e;
--foreground: #cccccc;
--border: #3c3c3c;
--muted: #252526;
--muted-foreground: #858585;
```

#### Accent Colors
```css
--primary: #007acc;
--primary-foreground: #ffffff;
--primary-hover: #005a9e;
--primary-active: #004578;
```

#### Semantic Colors
```css
--success: #4ec9b0;
--warning: #dcdcaa;
--error: #f14c4c;
--info: #3794ff;
```

#### Git Colors
```css
--git-added: #73c991;
--git-modified: #e2c08d;
--git-deleted: #c74e39;
--git-untracked: #ffffff;
```

#### Chat Colors
```css
--chat-background: #2b2d31;
--chat-sidebar: #1e1f22;
--chat-message: #313338;
--chat-mention: #5865f2;
--chat-own-message: #3f4147;
```

#### AI Colors
```css
--ai-accent: #9b59b6;
--ai-ghost: #6a6a6a;
--ai-loading: #007acc;
--ai-error: #f14c4c;
```

### Color Palette (Light Theme)

#### Primary Colors
```css
--background: #ffffff;
--foreground: #333333;
--border: #e0e0e0;
--muted: #f3f3f3;
--muted-foreground: #666666;
```

#### Accent Colors
```css
--primary: #0066b8;
--primary-foreground: #ffffff;
--primary-hover: #005090;
--primary-active: #003a70;
```

### Typography

#### Font Families
```css
--font-ui: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-editor: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
--font-mono: 'SF Mono', 'Monaco', 'Consolas', monospace;
```

#### Font Sizes
```css
--text-xs: 11px;
--text-sm: 12px;
--text-base: 13px;
--text-md: 14px;
--text-lg: 16px;
--text-xl: 18px;
--text-2xl: 20px;
```

#### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing Scale

```css
--space-0: 0px;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### Border Radius

```css
--radius-none: 0px;
--radius-sm: 2px;
--radius-base: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
--shadow-base: 0 1px 3px rgba(0, 0, 0, 0.2);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.15);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.2);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.25);
```

### Transitions

```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

### Z-Index Scale

```css
--z-dropdown: 100;
--z-sticky: 200;
--z-fixed: 300;
--z-modal: 400;
--z-popover: 500;
--z-tooltip: 600;
```

## Component States

### Button States

#### Primary Button
```css
.button-primary {
  background: var(--primary);
  color: var(--primary-foreground);
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-base);
  font-weight: var(--font-medium);
  transition: var(--transition-fast);
}

.button-primary:hover {
  background: var(--primary-hover);
}

.button-primary:active {
  background: var(--primary-active);
}

.button-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Secondary Button
```css
.button-secondary {
  background: transparent;
  color: var(--foreground);
  border: 1px solid var(--border);
  padding: 8px 16px;
  border-radius: var(--radius-base);
  font-weight: var(--font-medium);
  transition: var(--transition-fast);
}

.button-secondary:hover {
  background: var(--muted);
  border-color: var(--primary);
}
```

#### Ghost Button
```css
.button-ghost {
  background: transparent;
  color: var(--foreground);
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-base);
  font-weight: var(--font-medium);
  transition: var(--transition-fast);
}

.button-ghost:hover {
  background: var(--muted);
}
```

### Input States

#### Text Input
```css
.input {
  background: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
  padding: 8px 12px;
  border-radius: var(--radius-base);
  font-size: var(--text-base);
  transition: var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-hover);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Panel States

#### Collapsed Panel
```css
.panel-collapsed {
  width: 48px;
  min-width: 48px;
  transition: var(--transition-base);
}
```

#### Expanded Panel
```css
.panel-expanded {
  width: 240px;
  min-width: 240px;
  transition: var(--transition-base);
}
```

## Accessibility

### Focus Indicators

```css
:focus-visible {
  outline: px solid var(--primary);
  outline-offset: 2px;
}
```

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  :root {
    --border: #ffffff;
    --foreground: #ffffff;
    --background: #000000;
  }
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Reader Support

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## Icon System

### Icon Sizes
```css
--icon-xs: 12px;
--icon-sm: 14px;
--icon-base: 16px;
--icon-md: 18px;
--icon-lg: 20px;
--icon-xl: 24px;
```

### Icon Colors
```css
.icon-default {
  color: var(--foreground);
}

.icon-muted {
  color: var(--muted-foreground);
}

.icon-primary {
  color: var(--primary);
}

.icon-success {
  color: var(--success);
}

.icon-warning {
  color: var(--warning);
}

.icon-error {
  color: var(--error);
}
```

## Responsive Breakpoints

```css
--breakpoint-xs: 0px;
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
--breakpoint-3xl: 1920px;
```

### Responsive Behavior

#### Small Screens (< 1280px)
```css
@media (max-width: 1279px) {
  .sidebar {
    width: 200px;
  }
  
  .chat-panel {
    display: none;
  }
  
  .terminal {
    height: 150px;
  }
}
```

#### Medium Screens (1280px - 1919px)
```css
@media (min-width: 1280px) and (max-width: 1919px) {
  .sidebar {
    width: 220px;
  }
  
  .chat-panel {
    width: 280px;
  }
  
  .terminal {
    height: 200px;
  }
}
```

#### Large Screens (>= 1920px)
```css
@media (min-width: 1920px) {
  .sidebar {
    width: 240px;
  }
  
  .chat-panel {
    width: 320px;
  }
  
  .terminal {
    height: 250px;
  }
}
```

## Animation System

### Keyframes

```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

### Animation Classes

```css
.animate-spin {
  animation: spin 1s linear infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-slide-in {
  animation: slideIn 200ms ease-out;
}

.animate-fade-in {
  animation: fadeIn 150ms ease-out;
}
```

## Component Variants

### Tab Variants

```css
.tab {
  padding: 8px 16px;
  border-bottom: 2px solid transparent;
  transition: var(--transition-fast);
}

.tab-active {
  border-bottom-color: var(--primary);
  background: var(--muted);
}

.tab-modified {
  position: relative;
}

.tab-modified::after {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  background: var(--warning);
  border-radius: 50%;
}
```

### Message Variants

```css
.message {
  padding: 8px 16px;
  border-radius: var(--radius-base);
  margin-bottom: 8px;
}

.message-own {
  background: var(--chat-own-message);
  margin-left: 32px;
}

.message-other {
  background: var(--chat-message);
  margin-right: 32px;
}

.message-mention {
  background: var(--chat-mention);
  color: white;
}
```

## Design Tokens Summary

### Layout
- Activity Bar: 48px
- Sidebar: 240px (collapsible to 48px)
- Editor: 75-85% of screen
- Terminal: 200px (collapsible)
- Chat Panel: 280px (collapsible)
- Status Bar: 24px

### Typography
- UI Font: Inter, 13px
- Editor Font: JetBrains Mono, 14px
- Line Height: 1.5

### ColorsDark Theme
- Background: #1e1e1e
- Foreground: #cccccc
- Primary: #007acc
- Border: #3c3c3c

### Spacing
- Base unit: 4px
- Component padding: 8-16px
- Gap between items: 8-16px

### Effects
- Border radius: 4px
- Transition: 150-200ms
- Shadow: subtle depth

### Accessibility
- Focus ring: 2px primary
- High contrast: WCAG AA
- Reduced motion: respected
