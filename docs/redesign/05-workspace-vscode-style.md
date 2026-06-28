# Workspace Layout Mockup (VS Code-Style)

## Philosophy
**Workspace should feel like VS Code**: Familiar patterns for developers, with collaboration and AI layered on top without disrupting the core editing experience.

## Complete Workspace Layout

### Full Layout (1920px screen)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Activity │ Sidebar │                    Editor Area                          │
│ Bar      │         │                                                          │
│ (48px)   │ (240px) │                                                          │
│          │         │ ┌─────────────────────────────────────────────────────┐ │
│ ┌──────┐ │ ┌─────┐ │ │ Title Bar (28px)                                     │ │
│ │ 📁   │ │ │File │ │ │ CollabCode - Room: ABC123  │  [⋮]  [─] [□] [✕]     │ │
│ ├──────┤ │ │Tree │ │ └─────────────────────────────────────────────────────┘ │
│ │ 🔍   │ │ ├─────┤ │ │                                                       │ │
│ ├──────┤ │ │Proj │ │ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ 🌿   │ │ │ects │ │ │ │ Tab Bar (35px)                                    │ │ │
│ ├──────┤ │ ├─────┤ │ │ │ Button.tsx │ Card.tsx │ Form.tsx │ Settings.tsx  │ │ │
│ │ 👥   │ │ │Room │ │ │ │ ──────────────────────────────────────────────── │ │ │
│ ├──────┤ │ ├─────┤ │ │ └─────────────────────────────────────────────────┘ │ │
│ │ 🧩   │ │ │Info │ │ │                                                       │ │
│ ├──────┤ │ ├─────┤ │ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ ⚙️   │ │ │Git  │ │ │ │ Breadcrumb (24px)                                │ │ │
│ └──────┘ │ └─────┘ │ │ │ src › components › Button.tsx                    │ │ │
│          │         │ │ └─────────────────────────────────────────────────┘ │ │
│          │         │ │                                                       │ │
│          │         │ │ ┌─────────────────────────────────────────────────┐ │ │
│          │         │ │ │                                                 │ │ │
│          │         │ │ │          Editor (Monaco)                        │ │ │
│          │         │ │ │                                                 │ │ │
│          │         │ │ │  const Button = ({ onClick, children }) => {  │ │ │
│          │         │ │ │    const handleClick = () => {                  │ │ │
│          │         │ │ │      onClick();                                │ │ │
│          │         │ │ │    };                                            │ │ │
│          │         │ │ │                                                 │ │ │
│          │         │ │ │    return (                                      │ │ │
│          │         │ │ │      <button onClick={handleClick}>             │ │ │
│          │         │ │ │        {children}                               │ │ │
│          │         │ │ │      </button>                                   │ │ │
│          │         │ │ │    );                                            │ │ │
│          │         │ │ │  };                                              │ │ │
│          │         │ │ │                                                 │ │ │
│          │         │ │ │                                                 │ │ │
│          │         │ │ │                                                 │ │ │
│          │         │ │ │                                                 │ │ │
│          │         │ │ └─────────────────────────────────────────────────┘ │ │
│          │         │ │                                                       │ │
│          │         │ │ ┌─────────────────────────────────────────────────┐ │ │
│          │         │ │ │ Terminal (200px, collapsible)                    │ │ │
│          │         │ │ │ $ npm run dev                                   │ │ │
│          │         │ │ │ ▶ Starting development server...                 │ │ │
│          │         │ │ │ ✓ Ready in 1.2s                                  │ │ │
│          │         │ │ │   Local: http://localhost:3000                  │ │ │
│          │         │ │ └─────────────────────────────────────────────────┘ │ │
│          │         │ │                                                       │ │
│          │         │ │ ┌─────────────────────────────────────────────────┐ │ │
│          │         │ │ │ Status Bar (24px)                                │ │ │
│          │         │ │ │ main* │ Ln 12, Col 34 │ UTF-8 │ TypeScript     │ │ │
│          │         │ │ │ Prettier │ Git: 3 changes │ 🔗 Connected        │ │ │
│          │         │ │ └─────────────────────────────────────────────────┘ │ │
│          │         │ └─────────────────────────────────────────────────────┘ │
│          │         │                                                          │
│          │         │ ┌─────────────────────────────────────────────────────┐ │
│          │         │ │ Chat Panel (280px, collapsible)                      │ │
│          │         │ │ # general │ # code-review │ @mentions                │ │
│          │         │ │ ───────────────────────────────────────────────────── │ │
│          │         │ │ John: Hey, can you review this PR?                   │ │
│          │         │ │ Sarah: Sure, looking at it now                       │ │
│          │         │ │ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Title Bar (28px)
```
┌─────────────────────────────────────────────────────────────┐
│ CollabCode - Room: ABC123  │  [⋮]  [─] [□] [✕]             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- App name + room code
- Menu button (⋮)
- Window controls (minimize, maximize, close)
- Customizable via settings

### 2. Tab Bar (35px)
```
┌─────────────────────────────────────────────────────────────┐
│ Button.tsx │ Card.tsx │ Form.tsx │ Settings.tsx │ [+]      │
│ ─────────────────────────────────────────────────────────   │
│ [Active]    [Hover]   [Modified] [Normal]    [New Tab]     │
└─────────────────────────────────────────────────────────────┘
```

**States:**
- **Active**: Accent border on bottom, higher contrast
- **Modified**: Dot indicator, different color
- **Hover**: Slightly lighter background
- **Normal**: Muted text

**Features:**
- Drag to reorder
- Middle-click to close
- Right-click for context menu
- Split view indicator
- Grouped tabs (optional)

### 3. Breadcrumb (24px)
```
┌─────────────────────────────────────────────────────────────┐
│ src › components › Button.tsx                    [×]       │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Click segment to navigate
- Shows full path
- Close button for current file
- Truncates with ... on long paths

### 4. Editor Area (Flexible)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  const Button = ({ onClick, children }) => {              │
│    const handleClick = () => {                            │
│      onClick();                                            │
│    };                                                      │
│                                                             │
│    return (                                                │
│      <button onClick={handleClick}>                       │
│        {children}                                          │
│      </button>                                             │
│    );                                                      │
│  };                                                        │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Monaco Editor (full-featured)
- Minimap (toggleable)
- Line numbers (toggleable)
- Word wrap (toggleable)
- Syntax highlighting
- IntelliSense
- Multi-cursor editing
- Code folding

### 5. Terminal (200px, collapsible)
```
┌─────────────────────────────────────────────────────────────┐
│ TERMINAL │ PROBLEMS │ OUTPUT │ DEBUG         [×] [−] [+]  │
├─────────────────────────────────────────────────────────────┤
│ $ npm run dev                                               │
│ ▶ Starting development server...                            │
│ ✓ Ready in 1.2s                                             │
│   Local: http://localhost:3000                             │
│                                                             │
│ $ git status                                                │
│ On branch main                                              │
│ Changes not staged for commit:                              │
│   modified: src/components/Button.tsx                       │
│                                                             │
│ $ █                                                         │
└─────────────────────────────────────────────────────────────┘
```

**Terminal Tabs:**
- Terminal (shell)
- Problems (linting errors)
- Output (build output)
- Debug Console

**Features:**
- Multiple terminal instances
- Split terminals
- Command history
- Search in terminal
- Clear terminal

### 6. Status Bar (24px)
```
┌─────────────────────────────────────────────────────────────┐
│ main* │ Ln 12, Col 34 │ UTF-8 │ TypeScript │ Prettier      │
│ Git: 3 changes │ 🔗 Connected │ AI: Ready                   │
└─────────────────────────────────────────────────────────────┘
```

**Status Items (Left to Right):**
1. Git branch (with * if modified)
2. Cursor position (line, column)
3. File encoding
4. Language mode
5. Formatter (Prettier, ESLint, etc.)
6. Git status (changes count)
7. Connection status (Yjs, WebRTC)
8. AI provider status

**Features:**
- Click item for quick action
- Hover for more info
- Color-coded status
- Customizable items

### 7. Activity Bar (48px)
```
┌────┐
│ 📁 │ ← Explorer (Cmd+Shift+E)
│ 🔍 │ ← Search (Cmd+Shift+F)
│ 🌿 │ ← Git (Cmd+Shift+G)
│ 👥 │ ← Collab (Cmd+Shift+O)
│ 🧩 │ ← Extensions (Cmd+Shift+X)
│ ⚙️  │ ← Settings (Cmd+,)
└────┘
```

**Features:**
- Single click toggles panel
- Active panel highlighted
- Tooltip with name + shortcut
- Badge for notifications
- Right-click for context menu

### 8. Sidebar (240px, collapsible)
```
┌─────────────────────────────────────────┐
│ EXPLORER                    [×]         │
├─────────────────────────────────────────┤
│ ▼ src                                   │
│   ▼ components                          │
│     ○ Button.tsx  M                    │
│     ○ Card.tsx                          │
│     ○ Form.tsx   A                      │
│   ▼ utils                               │
│     ○ helpers.ts                        │
│ ▼ public                                │
│   ○ index.html                          │
│                                         │
│ OUTLINE (Button.tsx)                    │
│ ▼ Button                                │
│   export function Button()              │
│   const handleClick                     │
│   return (                              │
└─────────────────────────────────────────┘
```

**Features:**
- File tree with expand/collapse
- Git status indicators (M, A, D, U)
- File icons by type
- Outline view for current file
- Search in files
- Filter by type

## Panel States

### Sidebar Collapsed
```
┌────┐ ┌─────────────────────────────────────────────────────┐
│ 📁 │ │                                                     │
│ 🔍 │ │                    EDITOR AREA                    │
│ 🌿 │ │                                                     │
│ 👥 │ │                                                     │
│ 🧩 │ │                                                     │
│ ⚙️  │ │                                                     │
└────┘ └─────────────────────────────────────────────────────┘
```

### Terminal Collapsed
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    EDITOR AREA (expanded)                   │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Chat Panel Collapsed
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    EDITOR AREA (expanded)                   │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### All Panels Collapsed (Zen Mode)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                    EDITOR AREA (full screen)                 │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Zen Mode Features:**
- Esc to exit
- Distraction-free editing
- Full screen editor
- All panels hidden
- Minimal UI

## Split Editor

### Horizontal Split
```
┌─────────────────────────────────────────────────────────────┐
│ Button.tsx │ Card.tsx                                       │
│ ─────────────────────────────────────────────────────────   │
│ ┌─────────────────────┐ ┌─────────────────────────────────┐ │
│ │ const Button = ()   │ │ const Card = ({ title }) => { │ │
│ │   return <button>   │ │   return <div>{title}</div>    │ │
│ │ </button>           │ │ }                             │ │
│ └─────────────────────┘ └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Vertical Split
```
┌─────────────────────────────────────────────────────────────┐
│ Button.tsx                                                   │
│ ─────────────────────────────────────────────────────────   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ const Button = () => {                                   │ │
│ │   return <button>Click me</button>                       │ │
│ │ }                                                        │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ const Card = ({ title }) => {                            │ │
│ │   return <div>{title}</div>                              │ │
│ │ }                                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Minimap
```
┌─────────────────────────────────────────────────────────────┐
│ const Button = ({ onClick, children }) => {              │
│   const handleClick = () => {                            │
│     onClick();                                            │
│   };                                                      │
│                                                             │
│   return (                                                │
│     <button onClick={handleClick}>                       │
│       {children}                                          │
│     </button>                                             │
│   );                                                      │
│ };                                                        │
│                                                             │
│ ┌────┐                                                     │
│ │ ████│  ← Minimap (right edge)                           │
│ │ ████│                                                     │
│ │ ████│                                                     │
│ │ ████│                                                     │
│ │    │                                                     │
│ └────┘                                                     │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Shows code overview
- Click to jump to position
- Highlights current selection
- Toggleable in settings

## Context Menus

### Editor Context Menu
```
┌─────────────────────┐
│ Cut                 │
│ Copy                │
│ Paste               │
│ ─────────────────── │
│ Format Document     │
│ ─────────────────── │
│ Go to Definition    │
│ Find References     │
│ Rename Symbol       │
│ ─────────────────── │
│ AI: Explain         │
│ AI: Refactor        │
│ AI: Fix Bugs        │
└─────────────────────┘
```

### Tab Context Menu
```
┌─────────────────────┐
│ Close               │
│ Close Others        │
│ Close All           │
│ ─────────────────── │
│ Pin                 │
│ ─────────────────── │
│ Copy Path           │
│ Reveal in Sidebar   │
│ ─────────────────── │
│ Split Left          │
│ Split Right         │
│ Split Down          │
└─────────────────────┘
```

## Keyboard Shortcuts

### Editor
- `Cmd+S` - Save
- `Cmd+Z` - Undo
- `Cmd+Shift+Z` - Redo
- `Cmd+F` - Find
- `Cmd+Shift+F` - Find in Files
- `Cmd+G` - Go to Line
- `Cmd+Shift+G` - Go to Symbol
- `Cmd+D` - Select Next Occurrence
- `Cmd+Shift+D` - Select All Occurrences

### View
- `Cmd+B` - Toggle Sidebar
- `Cmd+J` - Toggle Terminal
- `Cmd+\` - Split Editor
- `Cmd+1` - Focus Editor Group 1
- `Cmd+2` - Focus Editor Group 2
- `Cmd+K Cmd+Z` - Zen Mode

### Navigation
- `Cmd+P` - Quick Open
- `Cmd+Shift+P` - Command Palette
- `Ctrl+Tab` - Next Tab
- `Ctrl+Shift+Tab` - Previous Tab
- `Cmd+[` - Go Back
- `Cmd+]` - Go Forward

## Visual Design System

### Colors (Dark Theme)
- **Background**: #1e1e1e
- **Sidebar**: #252526
- **Activity Bar**: #333333
- **Title Bar**: #3c3c3c
- **Status Bar**: #007acc
- **Border**: #3c3c3c
- **Text**: #cccccc
- **Accent**: #007acc

### Typography
- **UI Font**: Inter, system-ui
- **Editor Font**: JetBrains Mono, Fira Code
- **UI Size**: 13px
- **Editor Size**: 14px
- **Line Height**: 1.5

### Spacing
- **Panel padding**: 8px
- **Item height**: 24px
- **Icon size**: 16px
- **Border radius**: 4px

### Effects
- **Shadows**: Subtle, depth
- **Transitions**: 150ms ease
- **Hover**: 10% lighter
- **Active**: Accent color

## Accessibility

### Screen Reader Support
- Proper ARIA labels on all UI elements
- Announcements for panel state changes
- Keyboard navigation for all features
- Focus indicators clearly visible

### High Contrast Mode
- Increased contrast ratios
- Clearer borders
- More distinct active states
- Reduced reliance on color alone

### Reduced Motion
- Respect prefers-reduced-motion
- Disable animations when requested
- Smooth transitions only when enabled
