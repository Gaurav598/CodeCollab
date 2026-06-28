# Navigation Hierarchy Mockup

## Navigation Philosophy
**Editor First**: Navigation should never take focus away from editing. All navigation should be accessible via keyboard shortcuts and should feel secondary to the code.

## Primary Navigation (Always Accessible)

### 1. Command Palette (Cmd+Shift+P)
```
┌─────────────────────────────────────────────────────────────┐
│ >                                                            │
│ ─────────────────────────────────────────────────────────   │
│ Recent Files                                                │
│  src/components/Button.tsx                                 │
│  src/utils/helpers.ts                                       │
│                                                             │
│ Commands                                                    │
│  Git: Commit all changes                                    │
│  Git: Push to remote                                        │
│  AI: Refactor selection                                    │
│  AI: Explain code                                           │
│  View: Toggle Terminal                                      │
│  View: Toggle Sidebar                                       │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Opens centered overlay
- Fuzzy search through all commands
- Recent files at top
- Keyboard navigation (↑↓ to navigate, Enter to select)
- Esc to close

### 2. File Quick Open (Cmd+P)
```
┌─────────────────────────────────────────────────────────────┐
│ > src/components/Button                                     │
│ ─────────────────────────────────────────────────────────   │
│ src/components/Button.tsx                                   │
│ src/components/Button.test.tsx                              │
│ src/components/Button.module.css                            │
│ src/utils/buttonHelpers.ts                                  │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Opens centered overlay
- Fuzzy search through all files in workspace
- Shows file path and type icon
- Tab to preview, Enter to open

### 3. Tab Switching (Cmd+1, Cmd+2, Cmd+3...)
```
Visual State:
┌─────────────────────────────────────────────────────────────┐
│ Button.tsx │ Card.tsx │ Form.tsx │ Modal.tsx │ Settings.tsx │
│ ─────────────────────────────────────────────────────────   │
│ [Active]    [Hover]   [Normal]  [Normal]   [Normal]        │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Numbered tabs visible in hover state
- Cmd+number to jump directly
- Cmd+Shift+number to move tab
- Middle-click or Cmd+W to close

## Secondary Navigation (Panel-Based)

### Activity Bar (Left Edge)
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

**Behavior:**
- Single click toggles panel
- Active panel highlighted with accent border
- Tooltip on hover shows name + shortcut
- Right-click for context menu

### Sidebar Panels

#### Explorer Panel (Cmd+Shift+E)
```
┌─────────────────────────────────────────┐
│ EXPLORER                    [×]         │
├─────────────────────────────────────────┤
│ ▼ src                                   │
│   ▼ components                          │
│     ○ Button.tsx                        │
│     ○ Card.tsx                          │
│     ○ Form.tsx                          │
│   ▼ utils                               │
│     ○ helpers.ts                        │
│ ▼ public                                │
│   ○ index.html                          │
│                                         │
│ OUTLINE                                 │
│ ▼ Button                                │
│   export function Button()              │
│   const handleClick                     │
│   return (                              │
└─────────────────────────────────────────┘
```

**Features:**
- File tree with expand/collapse
- File icons by type
- Git status indicators (M, A, D, U)
- Outline view for current file
- Breadcrumb navigation

#### Search Panel (Cmd+Shift+F)
```
┌─────────────────────────────────────────┐
│ SEARCH                      [×]         │
├─────────────────────────────────────────┤
│ Search: Button                          │
│ Replace:                               │
│ [x] Match Case  [x] Regex  [x] Whole   │
├─────────────────────────────────────────┤
│ Results: 23 matches in 4 files         │
│                                         │
│ src/components/Button.tsx (3)          │
│   const Button = () => {                │
│     return <Button />                   │
│   }                                     │
│                                         │
│ src/components/Card.tsx (5)            │
│   <Button onClick={...}>                │
│                                         │
│ src/utils/helpers.ts (15)              │
│   export const isButton = ...           │
└─────────────────────────────────────────┘
```

#### Git Panel (Cmd+Shift+G)
```
┌─────────────────────────────────────────┐
│ SOURCE CONTROL               [×]         │
├─────────────────────────────────────────┤
│ Branch: main ↑                           │
│                                         │
│ CHANGES (3)                             │
│ M  src/components/Button.tsx            │
│ M  src/utils/helpers.ts                 │
│ A  src/components/NewButton.tsx         │
│                                         │
│ [Commit] [Push] [Pull] [Discard]        │
├─────────────────────────────────────────┤
│ STAGED CHANGES (1)                      │
│ M  package.json                         │
│                                         │
│ [Commit] [Unstage]                      │
└─────────────────────────────────────────┘
```

#### Collab Panel (Cmd+Shift+O)
```
┌─────────────────────────────────────────┐
│ COLLABORATION               [×]         │
├─────────────────────────────────────────┤
│ ROOM: ABC123                            │
│                                         │
│ ONLINE (3)                              │
│ 👤 John Doe (editing Button.tsx)        │
│ 👤 Sarah Smith (viewing)                │
│ 👤 You (editing helpers.ts)             │
│                                         │
│ ROOM SETTINGS                           │
│ [Invite Link] [Video Call]              │
├─────────────────────────────────────────┤
│ ACTIVITY                                │
│ John opened Button.tsx                  │
│ Sarah joined the room                   │
│ You pushed to main                      │
└─────────────────────────────────────────┘
```

## Tertiary Navigation (Contextual)

### Context Menus
```
Right-click on file:
┌─────────────────────┐
│ Open                │
│ Open to the Side    │
│ Copy Path           │
│ Copy Relative Path  │
│ ─────────────────── │
│ Rename              │
│ Delete              │
│ ─────────────────── │
│ Git: Stage          │
│ Git: Discard        │
│ ─────────────────── │
│ AI: Explain         │
│ AI: Refactor        │
└─────────────────────┘
```

### Breadcrumb Navigation
```
┌─────────────────────────────────────────────────────────────┐
│ src › components › Button.tsx                    [×]       │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Click any segment to open that directory
- Shows full path to current file
- Right-click for file operations
- Truncates with ... on long paths

## Keyboard Shortcuts Reference

### File Operations
- `Cmd+P` - Quick Open
- `Cmd+N` - New File
- `Cmd+S` - Save
- `Cmd+Shift+S` - Save As
- `Cmd+W` - Close Tab
- `Cmd+Shift+W` - Close Window

### Editor Navigation
- `Cmd+G` - Go to Line
- `Cmd+Shift+G` - Go to Symbol
- `Cmd+T` - Go to File in Tab
- `Cmd+Shift+O` - Go to Symbol in Workspace
- `Cmd+K Cmd+↓` - Split Editor Down

### View Operations
- `Cmd+B` - Toggle Sidebar
- `Cmd+J` - Toggle Terminal
- `Cmd+\` - Split Editor
- `Cmd+1` - Focus Editor Group 1
- `Cmd+2` - Focus Editor Group 2

### AI Operations
- `Cmd+K` - AI Chat (inline)
- `Cmd+L` - AI Chat (panel)
- `Cmd+I` - AI Inline Complete
- `Cmd+Shift+A` - AI Actions Menu

### Collaboration
- `Cmd+Shift+C` - Toggle Chat Panel
- `Cmd+Shift+V` - Toggle Video
- `Cmd+Shift+O` - Toggle Collab Panel

## Navigation Flow Examples

### Opening a File
1. Press `Cmd+P`
2. Type file name (fuzzy search)
3. Press Enter to open
4. File opens in editor, tab appears

### Finding a Symbol
1. Press `Cmd+Shift+O`
2. Type symbol name
3. Press Enter to jump to definition
4. Cursor moves to symbol location

### Running AI on Selection
1. Select code in editor
2. Press `Cmd+K`
3. Type instruction or select action
4. AI response appears inline
5. Press Tab to accept, Esc to dismiss

### Starting a Code Review
1. Press `Cmd+Shift+C` to open chat
2. Type "@team review this PR"
3. Team members notified
4. Discussion happens in chat panel

## Visual Hierarchy for Navigation

### Priority 1: Editor Context
- Active tab (highest contrast)
- Cursor position (always visible)
- Selection (highlighted)

### Priority 2: Quick Actions
- Command palette (overlay, high contrast)
- Quick open (overlay, high contrast)
- Inline AI (overlay, high contrast)

### Priority 3: Panels
- Sidebar (medium contrast, collapsible)
- Terminal (low contrast, collapsible)
- Chat (medium contrast, collapsible)

### Priority 4: Status
- Status bar (low contrast, always visible)
- Activity bar (icons only, subtle)
- Notifications (toast, temporary)
