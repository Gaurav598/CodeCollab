# Chat Interface Mockup (Discord-Style)

## Philosophy
**Collaboration Second**: Chat should feel like a natural extension of the workspace, not the primary focus. It should be accessible but never intrusive.

## Chat Panel Layout

### Collapsed State (Icon Only)
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                                                               │
│                    EDITOR AREA                                │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────┐
│ 💬 │ ← Chat icon in Activity Bar
└────┘
```

### Expanded State (280px)
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                    EDITOR AREA                                │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│ 💬 CHAT                                      [×] [Collapse]  │
├─────────────────────────────────────────────────────────────┤
│ # general  │ # code-review  │ # random  │ @mentions       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ John Doe                          10:32 AM               │ │
│ │ Hey team, I just pushed the new button component.      │ │
│ │ Can someone review it?                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Sarah Smith                       10:35 AM               │ │
│ │ @John I'll take a look! Give me 5 minutes.             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ You                               10:40 AM               │ │
│ │ @Sarah Thanks! I also added some accessibility          │ │
│ │ improvements. Let me know if you have any questions.    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Mike Johnson                       10:45 AM               │
│ │ Looks great! One thing - should we add loading state?   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ John Doe                          10:47 AM               │
│ │ @Mike Good catch! I'll add that now.                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Typing indicator...]                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ > Message #general...                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Channel Structure

### Channel List
```
┌─────────────────────────────────────────┐
│ TEXT CHANNELS              [+ Create]   │
│                                         │
│ # general          [12]  ✓              │
│ # code-review      [5]                  │
│ # random           [3]                   │
│ # announcements    [1]   🔒             │
│                                         │
│ VOICE CHANNELS             [+ Create]   │
│                                         │
│ 🔊 General Voice    [2]                  │
│   👤 John Doe                            │
│   👤 Sarah Smith                          │
│                                         │
│ 🔊 Code Review     [0]                   │
│                                         │
│ DIRECT MESSAGES                         │
│                                         │
│ @John Doe                              │
│ @Sarah Smith                            │
│ @Mike Johnson                           │
└─────────────────────────────────────────┘
```

**Legend:**
- `#` - Text channel
- `🔊` - Voice channel
- `🔒` - Private channel
- `[N]` - Unread message count
- `✓` - Active channel

### Channel Header
```
┌─────────────────────────────────────────────────────────────┐
│ # general                                    [⋮] [Settings] │
├─────────────────────────────────────────────────────────────┤
│ General discussion for the team. Share updates, ask         │
│ questions, and collaborate on projects.                     │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Channel name and topic
- Channel settings menu
- Member count
- Pinned messages indicator

## Message Types

### Text Message
```
┌─────────────────────────────────────────────────────────┐
│ 👤 John Doe                          10:32 AM              │
│ Hey team, I just pushed the new button component.        │
│ Can someone review it?                                    │
└─────────────────────────────────────────────────────────┘
```

### Message with Code Block
```
┌─────────────────────────────────────────────────────────┐
│ 👤 Sarah Smith                       10:35 AM              │
│ I found a bug in the Form component:                    │
│                                                         │
│ ```typescript                                          │
│ const handleChange = (e) => {                          │
│   setValues({ ...values, [e.target.name]: e.target.   │
│ });                                                    │
│ };                                                     │
│ ```                                                    │
│                                                         │
│ The spread operator is missing the value!              │
└─────────────────────────────────────────────────────────┘
```

### Message with File Attachment
```
┌─────────────────────────────────────────────────────────┐
│ 👤 Mike Johnson                       10:40 AM              │
│ Here's the design mockup for the new dashboard:         │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ 📄 dashboard-mockup.fig (2.4 MB)                  │  │
│ │ [Download] [Preview]                               │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Message with Mention
```
┌─────────────────────────────────────────────────────────┐
│ 👤 John Doe                          10:45 AM              │
│ @Sarah Can you review the PR when you get a chance?     │
│ @Mike I need your help with the API integration.        │
└─────────────────────────────────────────────────────────┘
```

**Behavior:**
- Mentions highlighted with accent color
- Mentioned user receives notification
- Click mention to jump to user profile

### System Message
```
┌─────────────────────────────────────────────────────────┐
│ 🔔 10:50 AM                                             │
│ John Doe pinned a message to this channel.             │
└─────────────────────────────────────────────────────────┘
```

### Threaded Message
```
┌─────────────────────────────────────────────────────────┐
│ 👤 John Doe                          10:32 AM              │
│ Hey team, I just pushed the new button component.        │
│ Can someone review it?                                    │
│                                                         │
│ 💬 3 replies  [View Thread]                             │
│ └─────────────────────────────────────────────────────┘ │
│   👤 Sarah Smith  10:35 AM                               │
│   I'll take a look!                                      │
│                                                         │
│   👤 Mike Johnson  10:40 AM                              │
│   I can review it too if needed.                         │
│                                                         │
│   👤 You  10:45 AM                                       │
│   Thanks both!                                          │
└─────────────────────────────────────────────────────────┘
```

## Message Input

### Default State
```
┌─────────────────────────────────────────────────────────┐
│ > Message #general...                                    │
│                                                         │
│ [📎] [😀] [🎥] [📝] [Send]                               │
└─────────────────────────────────────────────────────────┘
```

### Typing State
```
┌─────────────────────────────────────────────────────────┐
│ > Hey team, I found an issue with the...                 │
│                                                         │
│ [📎] [😀] [🎥] [📝] [Send]                               │
└─────────────────────────────────────────────────────────┘
```

### Code Block Mode
```
┌─────────────────────────────────────────────────────────┐
│ ```typescript                                           │
│ const Button = () => {                                   │
│   return <button>Click me</button>                      │
│ }                                                        │
│ ```                                                      │
│                                                         │
│ [📎] [😀] [🎥] [📝] [Send]                               │
└─────────────────────────────────────────────────────────┘
```

**Input Features:**
- Multi-line support (Shift+Enter for new line)
- Code block syntax highlighting
- Emoji picker
- File attachment
- Voice message recording
- Code snippet insertion from editor

## Voice/Video Integration

### Voice Channel UI
```
┌─────────────────────────────────────────────────────────┐
│ 🔊 General Voice                         [⋮] [Leave]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│    👤 John Doe                                          │
│    🔊 Speaking                                         │
│                                                         │
│    👤 Sarah Smith                                       │
│    🔇 Muted                                             │
│                                                         │
│    👤 You                                               │
│    🔊 Speaking                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [🎤] [🔇] [🎧] [📹] [Share Screen]                      │
└─────────────────────────────────────────────────────────┘
```

**Voice Controls:**
- Toggle microphone
- Toggle deafen
- Toggle camera
- Share screen
- Adjust volume per user

### Video Call Overlay
```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────┐  ┌─────────────────┐               │
│ │                 │  │                 │               │
│ │   John Doe      │  │   Sarah Smith   │               │
│ │   🔊 Speaking   │  │   🔇 Muted      │               │
│ │                 │  │                 │               │
│ └─────────────────┘  └─────────────────┘               │
│                                                         │
│              [🎤] [🔇] [🎧] [📹] [End Call]               │
└─────────────────────────────────────────────────────────┘
```

## Notifications

### Unread Indicator
```
┌────┐
│ 💬 │ ← Badge with unread count
│  3 │
└────┘
```

### Mention Notification
```
┌─────────────────────────────────────────────────────────┐
│ 🔔 @Sarah mentioned you in #code-review                  │
│ "Can you review this PR when you get a chance?"         │
│                                                         │
│ [View Message] [Dismiss]                                │
└─────────────────────────────────────────────────────────┘
```

### Typing Indicator
```
┌─────────────────────────────────────────────────────────┐
│ John Doe is typing...                                    │
│ Sarah Smith is typing...                                 │
└─────────────────────────────────────────────────────────┘
```

## Keyboard Shortcuts

- `Cmd+Shift+C` - Toggle chat panel
- `Cmd+Shift+V` - Toggle voice/video
- `Cmd+K` - Quick channel switch
- `Cmd+/` - Focus message input
- `↑` - Edit last message
- `Esc` - Close chat panel

## Visual Design

### Color Scheme
- **Background**: Dark (#2b2d31)
- **Channel List**: Darker (#1e1f22)
- **Message Background**: Slightly lighter (#313338)
- **Own Message**: Accent color tint
- **Mention Highlight**: Accent color (#5865F2)
- **Typing Indicator**: Subtle gray

### Typography
- **Username**: Bold, 14px
- **Timestamp**: Gray, 11px
- **Message Body**: Regular, 14px
- **Code Block**: Monospace, 13px

### Spacing
- **Message padding**: 8px 16px
- **Avatar size**: 40px
- **Channel item height**: 32px
- **Input height**: 44px

## Accessibility

### Screen Reader Support
- Messages properly labeled with sender and timestamp
- Mentions announced as "mention from [user]"
- Code blocks announced with language
- Voice state changes announced

### Keyboard Navigation
- Full keyboard navigation through channels
- Tab through messages
- Enter to open thread
- Esc to close overlays

### High Contrast Mode
- Increased contrast for text
- Clearer borders
- More distinct active states

## Integration with Editor

### Code Sharing
```
┌─────────────────────────────────────────────────────────┐
│ 👤 You                              10:50 AM              │
│ Check out this function:                                │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ export const Button = ({ onClick, children }) => {│  │
│ │   const handleClick = () => {                     │  │
│ │     onClick();                                     │  │
│ │   };                                               │  │
│ │   return <button onClick={handleClick}>            │  │
│ │         {children}                                 │  │
│ │       </button>                                    │  │
│ │   };                                               │  │
│ │ };                                                 │  │
│ │                                                     │  │
│ │ [Open in Editor] [Copy]                           │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### File References
```
┌─────────────────────────────────────────────────────────┐
│ 👤 John Doe                          10:55 AM              │
│ I updated the Button component in src/components/       │
│ Button.tsx. Can you review the changes?                 │
│                                                         │
│ [Open File] [View Diff]                                 │
└─────────────────────────────────────────────────────────┘
```

### Quick Actions from Chat
- Right-click on file reference → Open in Editor
- Right-click on code block → Insert in Editor
- Right-click on mention → Direct message
