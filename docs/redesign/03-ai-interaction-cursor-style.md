# AI Interaction Mockup (Cursor-Style)

## Philosophy
**AI Third**: AI should feel like an intelligent assistant that appears when needed, disappears when not. It should never compete for attention with the editor.

## AI Interaction Patterns

### 1. Inline Autocomplete (Cmd+I)
```
┌─────────────────────────────────────────────────────────────┐
│ const Button = ({ onClick, children }) => {                  │
│   const handleClick = () => {                                │
│     onClick();                                                │
│   };                                                          │
│                                                                │
│   return (                                                    │
│     <button onClick={handleClick}>                           │
│       {children}                                              │
│     </button>                                                │
│   );                                                          │
│ };                                                            │
│                                                                │
│ const Card = ({ title, content }) => {                       │
│   return (                                                    │
│     <div className="card">                                    │
│       <h2>{title}</h2>                                       │
│       <p>{content}</p>                                       │
│     </div>                                                    │
│   );                                                          │
│ };                                                            │
│                                                                │
│ const Form = ({ onSubmit, fields }) => {                     │
│   const [values, setValues] = useState({});                  │
│                                                                │
│   const handleChange = (e) => {                               │
│     setValues({ ...values, [e.target.name]: e.target.val│
│     │ ue });                                                  │
│   };                                                          │
│                                                                │
│   const handleSubmit = (e) => {                               │
│     e.preventDefault();                                      │
│     onSubmit(values);                                         │
│   };                                                          │
│                                                                │
│   return (                                                    │
│     <form onSubmit={handleSubmit}>                           │
│       {fields.map((field) => (                                │
│         <input                                                │
│           key={field.name}                                    │
│           name={field.name}                                   │
│           onChange={handleChange}                             │
│           value={values[field.name] || ''}                   │
│         />                                                    │
│       ))}                                                     │
│     </form>                                                   │
│   );                                                          │
│ };                                                            │
│                                                                │
│ const Modal = ({ isOpen, onClose, children }) => {           │
│   if (!isOpen) return null;                                   │
│                                                                │
│   return (                                                    │
│     <div className="modal-overlay">                           │
│       <div className="modal-content">                         │
│         <button onClick={onClose}>Close</button>              │
│         {children}                                            │
│       </div>                                                   │
│     </div>                                                    │
│   );                                                          │
│ };                                                            │
└─────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                          Ghost text (gray, italic)
                          Press Tab to accept
```

**Behavior:**
- Triggers automatically after typing pause (300ms)
- Shows ghost text in gray, italic
- Press Tab to accept, Esc to dismiss
- Works for single-line and multi-line completions
- Context-aware (uses open files, recent edits)

### 2. Inline Chat (Cmd+K)
```
┌─────────────────────────────────────────────────────────────┐
│ const Button = ({ onClick, children }) => {                  │
│   const handleClick = () => {                                │
│     onClick();                                                │
│   };                                                          │
│                                                                │
│   return (                                                    │
│     <button onClick={handleClick}>                           │
│       {children}                                              │
│     </button>                                                │
│   );                                                          │
│ };                                                            │
│                                                                │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ > How can I make this button accessible?                │ │
│ │ ──────────────────────────────────────────────────────── │ │
│ │ [Refactor] [Explain] [Fix] [Test] [Docs]                │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                                │
│ To make this button accessible, you should add:              │
│ 1. Aria labels for screen readers                            │
│ 2. Keyboard support (Enter/Space)                           │
│ 3. Focus indicators                                          │
│                                                                │
│ Would you like me to refactor this code?                    │
│                                                                │
│ [Yes, refactor] [No thanks]                                  │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Opens at cursor position
- Small input field (single line by default)
- Quick action buttons below input
- AI response appears below input
- Diff preview for code changes
- Accept/Reject buttons for suggestions

### 3. AI Chat Panel (Cmd+L)
```
┌─────────────────────────────────────────────────────────────┐
│ AI CHAT                                      [×] [Pin]      │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ You: Explain the useState hook in this component       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                                │
│ The useState hook is a React hook that allows you to add    │
│ state to functional components. In this Form component:     │
│                                                                │
│ 1. `const [values, setValues] = useState({})` initializes   │
│    state with an empty object                                │
│                                                                │
│ 2. `setValues` updates the state when the form input        │
│    changes                                                    │
│                                                                │
│ 3. The state is used to control the input values and         │
│    submitted to the parent component                         │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ You: How can I add validation?                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                                │
│ You can add validation by:                                   │
│                                                                │
│ ```typescript                                                │
│ const validate = (values) => {                               │
│   const errors = {};                                          │
│   if (!values.email) errors.email = 'Required';              │
│   if (!values.password) errors.password = 'Required';       │
│   return errors;                                              │
│ };                                                            │
│ ```                                                          │
│                                                                │
│ [Insert Code] [Copy] [Explain More]                         │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ > Ask a question...                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Opens as right sidebar (320px)
- Conversation history preserved
- Code blocks with syntax highlighting
- Insert code directly into editor
- Can be pinned to stay open
- Collapses to icon when not in use

### 4. Quick Actions Menu (Cmd+Shift+A)
```
┌─────────────────────────────────────────────────────────────┐
│ AI ACTIONS                                    [×]           │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📝 Refactor                                             │ │
│ │    Improve code readability while preserving behavior   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🐛 Detect Bugs                                          │ │
│ │    Find syntax, logic, security, and null-safety issues │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 📖 Explain                                              │ │
│ │    Explain the selected code, function, or class        │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 📋 Review                                                │ │
│ │    Review code quality, security, and performance        │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🧪 Generate Tests                                       │ │
│ │    Generate unit tests for selected code                │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 📚 Generate Docs                                        │ │
│ │    Generate documentation, comments, or README          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Opens centered overlay
- Grid of action cards
- Icons for quick recognition
- Description for each action
- Click to execute, Esc to close

### 5. Diff Preview (Refactoring)
```
┌─────────────────────────────────────────────────────────────┐
│ const Button = ({ onClick, children }) => {                  │
│   const handleClick = () => {                                │
│     onClick();                                                │
│   };                                                          │
│                                                                │
│   return (                                                    │
│     <button                                                   │
│       onClick={handleClick}                                   │
│       className="btn"                                        │
│     >                                                         │
│       {children}                                              │
│     </button>                                                 │
│   );                                                          │
│ };                                                            │
│                                                                │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ DIFF PREVIEW                                 [Accept] [×] │ │
│ ├───────────────────────────────────────────────────────────┤ │
│ │ - const Button = ({ onClick, children }) => {             │ │
│ │ + const Button = ({ onClick, children, disabled = false }) => { │
│ │                                                              │ │
│ │   const handleClick = () => {                               │ │
│ │     if (disabled) return;                                  │ │
│ │     onClick();                                              │ │
│ │   };                                                        │ │
│ │                                                              │ │
│ │   return (                                                  │ │
│ │     <button                                                 │ │
│ │       onClick={handleClick}                                │ │
│ │ -     className="btn"                                      │ │
│ │ +     className={`btn ${disabled ? 'btn-disabled' : ''}`}  │ │
│ │ +     disabled={disabled}                                  │ │
│ │     >                                                       │ │
│ │       {children}                                            │ │
│ │     </button>                                               │ │
│ │   );                                                        │ │
│ │ };                                                          │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                                │
│ [Accept All] [Reject] [Undo]                                 │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Shows inline diff in editor
- Red for removed, green for added
- Accept/Reject buttons
- Can apply individual changes
- Undo support

## AI States & Feedback

### Loading State
```
┌───────────────────────────────────────────────────────────┐
│ > How can I optimize this function?                      │
│ ───────────────────────────────────────────────────────── │
│                                                           │
│  Thinking...                                              │
│  ○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○ │
│                                                           │
│  Analyzing code complexity...                            │
│  Identifying bottlenecks...                              │
└───────────────────────────────────────────────────────────┘
```

### Error State
```
┌───────────────────────────────────────────────────────────┐
│ > Refactor this code                                      │
│ ───────────────────────────────────────────────────────── │
│                                                           │
│  ⚠️ Error: AI service unavailable                        │
│                                                           │
│  The AI service is currently experiencing issues.        │
│  Please try again later or check your connection.        │
│                                                           │
│  [Retry] [Dismiss]                                        │
└───────────────────────────────────────────────────────────┘
```

### Empty State (No File Open)
```
┌───────────────────────────────────────────────────────────┐
│ AI CHAT                                      [×]           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│   📝 Open a file to start using AI features               │
│                                                           │
│   AI can help you:                                        │
│   • Refactor code                                         │
│   • Detect bugs                                           │
│   • Explain functions                                    │
│   • Generate tests                                        │
│   • Write documentation                                   │
│                                                           │
│   Open a file from the sidebar or use Cmd+P               │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## AI Context Awareness

### Context Indicators
```
┌───────────────────────────────────────────────────────────┐
│ AI CHAT                                      [×]           │
├───────────────────────────────────────────────────────────┤
│ Context: Button.tsx + 3 related files                      │
│ Provider: OpenAI (GPT-4)                                  │
│ ───────────────────────────────────────────────────────── │
│                                                           │
│ You: How does this button interact with the Form?        │
│                                                           │
│ Based on the open files, this Button component is used... │
└───────────────────────────────────────────────────────────┘
```

### Context Selection
```
┌───────────────────────────────────────────────────────────┐
│ SELECT CONTEXT                              [×]           │
├───────────────────────────────────────────────────────────┤
│ Active File: Button.tsx ✓                                   │
│                                                           │
│ Related Files:                                            │
│ [✓] Form.tsx                                              │
│ [✓] Card.tsx                                              │
│ [ ] Modal.tsx                                              │
│ [ ] utils/helpers.ts                                       │
│                                                           │
│ [Apply] [Cancel]                                          │
└───────────────────────────────────────────────────────────┘
```

## Keyboard Shortcuts for AI

- `Cmd+K` - Inline chat at cursor
- `Cmd+L` - Open AI chat panel
- `Cmd+I` - Trigger inline autocomplete
- `Cmd+Shift+A` - AI actions menu
- `Tab` - Accept AI suggestion
- `Esc` - Dismiss AI suggestion
- `Cmd+Z` - Undo AI change
- `Cmd+Shift+Z` - Redo AI change

## Visual Design Principles

### 1. Subtle Presence
- AI suggestions use ghost text (gray, italic)
- Chat panel uses medium contrast
- Never obscures code being edited

### 2. Clear Feedback
- Loading indicators with animation
- Error states with clear messages
- Success states with confirmation

### 3. Easy Dismissal
- Esc closes all AI overlays
- Click outside dismisses inline chat
- Clear close buttons on all panels

### 4. Context Awareness
- Always shows what files are in context
- Indicates AI provider being used
- Shows latency for transparency

## Accessibility

### Screen Reader Support
- AI announcements: "AI suggestion available, press Tab to accept"
- Chat messages properly labeled
- Diff regions announced with "removed" / "added"

### Keyboard Navigation
- Full keyboard support for all AI features
- Focus management in chat panel
- Keyboard shortcuts for common actions

### Reduced Motion
- Loading animations respect prefers-reduced-motion
- No flashing or strobing effects
- Smooth transitions only when enabled
