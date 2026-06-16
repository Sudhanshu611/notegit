# NoteGit — UI Specification
> Git-inspired local notes with real-time DSA visualization. Minimal, like Notion. Technical, like a terminal.

---

## Design Philosophy

NoteGit sits at the intersection of a developer tool and a thinking space. The UI should feel like a well-configured code editor that someone has made warm enough to write prose in — not a polished SaaS dashboard, not a bare terminal, but something between.

**Aesthetic direction:** Monospace meets editorial. Dark-first. Structured but not rigid. Every surface earns its existence.

**One rule:** If an element doesn't carry information, remove it.

---

## Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#0E0F11` | App background |
| `--bg-surface` | `#16181C` | Sidebar, panels |
| `--bg-card` | `#1E2027` | Note cards, modals |
| `--bg-hover` | `#252830` | Hover states |
| `--border` | `#2E3139` | Dividers, outlines |
| `--text-primary` | `#E8E9EC` | Headings, body text |
| `--text-secondary` | `#8B8FA8` | Labels, metadata |
| `--text-muted` | `#4A4E62` | Placeholders, timestamps |
| `--accent-green` | `#3DDC84` | Commits, success (Git green) |
| `--accent-blue` | `#5B8DEF` | Branches, links |
| `--accent-amber` | `#F5A623` | Warnings, AI suggestions |
| `--accent-red` | `#E05C5C` | Deletions, conflicts |
| `--accent-purple` | `#A78BFA` | DSA visualizer highlight |
| `--vis-node` | `#252830` | DSA node background |
| `--vis-edge` | `#3DDC84` | DSA edge / pointer lines |

---

## Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Title | `JetBrains Mono` | 600 | 20–28px |
| Body / Editor | `JetBrains Mono` | 400 | 14px |
| Labels / Meta | `Inter` | 400 | 11–12px |
| AI Output | `Inter` | 400 italic | 13px |
| Commit Hash | `JetBrains Mono` | 400 | 11px, muted |

> Monospace everywhere that touches note content or version data. Inter only for UI chrome labels and AI prose.

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR  [NoteGit logo] [Branch selector ▾] [AI ✦] [⚙]   │
├──────────┬──────────────────────────┬────────────────────────┤
│          │                          │                        │
│ SIDEBAR  │    EDITOR AREA           │   DSA VISUALIZER       │
│          │                          │                        │
│ Notes    │  [ Note Title ]          │  ┌──────────────────┐  │
│ list     │                          │  │  Linked List     │  │
│          │  Note body (editable)    │  │  ○─→○─→○─→○      │  │
│ Recent   │                          │  └──────────────────┘  │
│          │                          │                        │
│ Branches │                          │  ┌──────────────────┐  │
│          │                          │  │  Stack (Undo)    │  │
│ Tags     │                          │  │  [ ] [ ] [▓]     │  │
│          │                          │  └──────────────────┘  │
│          ├──────────────────────────┤                        │
│          │  COMMIT BAR              │  ┌──────────────────┐  │
│          │  [msg input] [Commit ✓]  │  │  Hash Map        │  │
│          └──────────────────────────┘  │  {key → value}   │  │
│          │  COMMIT HISTORY (timeline) │  └──────────────────┘  │
│          │  ●─────●─────●─────●      │                        │
│          │  HEAD  c3f1  a7b2  ...    │                        │
└──────────┴────────────────────────────┴────────────────────────┘
```

**3-column layout:**
- Left: `240px` fixed sidebar
- Center: flexible editor (`min 480px`)
- Right: `320px` DSA visualizer panel (collapsible)

---

## Screen Breakdown

---

### 1. App Shell / Topbar

**Height:** 44px  
**Background:** `--bg-surface` with `1px` border-bottom `--border`

```
[ ⎇  NoteGit ]   [ main ▾ ]   ────────────────   [ ✦ AI ]  [ ⚙ ]
  Logo + name     Branch pill                      AI panel  Settings
```

**Elements:**
- **Logo:** `⎇` symbol (Unicode branch icon) + `NoteGit` in JetBrains Mono 600, `--text-primary`
- **Branch selector:** Pill button, `--bg-card` background, `--accent-blue` icon, shows current branch name. Click opens branch dropdown.
- **AI button `✦ AI`:** Right-aligned, `--accent-amber` glow on hover, opens AI side drawer
- **Settings `⚙`:** Icon only, muted

---

### 2. Sidebar

**Width:** 240px  
**Background:** `--bg-surface`  
**Border-right:** `1px solid --border`

#### Section: New Note
```
  [ + New Note ]
```
Full-width button, dashed border, `--accent-green` `+` icon, subtle on default, solid green on hover.

#### Section: Notes List
```
  NOTES
  ─────────────────────────────
  ▸ 📄 System Design Notes       ←  active: left accent bar --accent-green
      2 branches · 14 commits
  
    📄 DSA Study Plan
      1 branch · 7 commits
  
    📄 Interview Prep
      main · 3 commits
```

Each note item:
- Note title in `--text-primary` 14px JetBrains Mono
- Subline: branch count + commit count in `--text-muted` 11px Inter
- Active state: `2px` left border `--accent-green`, `--bg-hover` background
- Hover: `--bg-hover`
- Right-click context menu: `Rename`, `Delete`, `Create Branch`, `View History`

#### Section: Branches
```
  BRANCHES
  ─────────────────────────────
  ● main                       ← --accent-green dot = current
  ○ feature/graph-theory
  ○ experiment/recursion
```

#### Section: Tags
```
  TAGS
  ─────────────────────────────
  # dsa   # system-design   # interview
```

Small pill tags in `--bg-card`, `--text-secondary`.

---

### 3. Editor Area (Center Panel)

**Background:** `--bg-base`  
**Padding:** `48px 56px`

#### Note Header
```
  ← Back    System Design Notes    [ ⋯ More ]
  
  ┌──────────────────────────────────────────────────┐
  │  System Design Notes                              │
  │  ────────────────────────────────────────────     │
  │                                                  │
  │  /                                               │  ← cursor blinking
  └──────────────────────────────────────────────────┘
```

- Title: Large JetBrains Mono 600, `--text-primary`, 24px, editable inline (click to edit)
- Body: JetBrains Mono 400, 14px, line-height 1.8, `--text-primary`
- Placeholder: `Start writing... (Markdown supported)` in `--text-muted`
- Thin `1px` left rule in `--border` at line start (Notion-style margin guide)
- Supports: `**bold**`, `*italic*`, `# headings`, `` `code` ``, `- lists`, `> blockquotes`

#### Commit Bar (bottom of editor)
```
  ┌─────────────────────────────────────────────────────────┐
  │  ○  Commit message...                    [ Commit ✓ ]   │
  └─────────────────────────────────────────────────────────┘
        ↑ --text-muted placeholder           --accent-green button
```

- Fixed to bottom of editor area
- `--bg-surface` background, `1px` top border `--border`
- Input: monospace, 13px
- `✦ Generate with AI` link appears below input when content has changed
- Commit button: `--accent-green` background, dark text, `8px` radius

#### Commit Timeline (below commit bar, collapsible)
```
  HISTORY ──────────────────────────────────────────── [ ↕ ]
  
  ●  HEAD   a3f1b2c  "Added CAP theorem notes"     2 min ago
  ●          c9d42e1  "Initial draft"               1 hr ago
  ●          88ab031  "Branch: feature/graphs"      yesterday
```

- Each commit: monospace hash (7 chars), message, timestamp
- Hash in `--text-muted`, message in `--text-primary`, time in `--text-muted`
- `●` dot in `--accent-green` for commits, `--accent-blue` for branch points
- Click a commit → opens diff view (modal)
- Hover on commit row → shows `[ Restore ]` button

---

### 4. DSA Visualizer Panel (Right)

**Width:** 320px  
**Background:** `--bg-surface`  
**Border-left:** `1px solid --border`  
**Header:** `12px` Inter label `DSA VISUALIZER` in `--text-muted`, uppercase, letterspacing 0.1em

The panel is divided into live mini-visualizations, each in its own card (`--bg-card`, `8px` radius, `--border` border).

---

#### 4a. Linked List — Version History

```
  VERSION HISTORY  ──────────────
  
  [HEAD] ──→ [a3f1b] ──→ [c9d42] ──→ [88ab0]
   ↑ active                              ↑ root
```

- Nodes: `--vis-node` rounded rect, `--text-primary` hash text (11px mono)
- Arrows: `--vis-edge` (#3DDC84) SVG lines with arrowheads
- Active node: `--accent-green` border glow
- Animation: new node slides in from left on each commit

---

#### 4b. Stack — Undo / Redo

```
  UNDO STACK  ──────────────────
  
  ┌──────────────┐  ← TOP (most recent)
  │  typed "CAP" │
  ├──────────────┤
  │  deleted " " │
  ├──────────────┤
  │  typed "theo"│
  └──────────────┘
  
  REDO STACK  ──────────────────
  (empty)
```

- Stack grows upward
- Each frame: `--bg-card` block with operation label in 11px mono
- Push animation: frame slides down from top
- Pop animation: top frame fades + shrinks on undo action
- Max 5 frames visible; older ones fade out below

---

#### 4c. Hash Map — Note Index

```
  NOTE INDEX  ───────────────────
  
  hash("System Design")  →  slot 3
  hash("DSA Study Plan") →  slot 7
  hash("Interview Prep") →  slot 1
  
  [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ]
    ▓              ▓                    ▓
```

- Bottom: array of 8 bucket slots as equal-width cells
- Active (filled) slots: `--accent-purple` fill
- On note open: highlight path from key → hash → slot with a brief pulse animation
- Collision: show chaining visual (small linked nodes inside slot)

---

#### 4d. Array — Commit Timeline

```
  COMMIT ARRAY  ─────────────────
  
  [0]     [1]     [2]     [3]
  a3f1b   c9d42   88ab0   ...
  HEAD
```

- Horizontal array of index-labelled cells
- Each cell: `--bg-card` border, index `[n]` in `--text-muted` above, commit hash below
- HEAD pointer: `--accent-green` arrow beneath cell 0
- New commit: array shifts right, new cell appears at index 0 with slide animation

---

#### 4e. Graph — Branch & Merge

```
  BRANCH GRAPH  ─────────────────
  
       ●──────────────● main
       │
       └──●──────●    feature/graph-theory
               ↘
                ●──── experiment/recursion
```

- Nodes: circles, `--vis-node` fill, `--vis-edge` stroke
- Edges: `--vis-edge` color SVG paths
- Branch names: `--text-secondary` 11px labels on node right
- Merge node: double-ring circle
- Active branch node: `--accent-green` filled

---

### 5. Diff View (Modal)

Triggered when clicking a commit in history.

```
  ┌─────────────────────────────────────────────────────────┐
  │  Compare: a3f1b2c → c9d42e1                       [ ✕ ] │
  ├─────────────────────────────────────────────────────────┤
  │                                                         │
  │  - Load balancing distributes requests                  │  ← red, deletion
  │  + Load balancing evenly distributes requests           │  ← green, addition
  │    across multiple servers to prevent overload.         │  ← unchanged
  │                                                         │
  ├─────────────────────────────────────────────────────────┤
  │  ✦ AI Summary: Added the word "evenly" for precision.   │
  │    Minor clarification to the definition.               │
  └─────────────────────────────────────────────────────────┘
  
  [ ← Older ]                              [ Restore This Version ]
```

- Modal: `--bg-card` background, `16px` radius, centered, `max-width 680px`
- Removed lines: `--accent-red` left border + faint red bg tint, `-` prefix
- Added lines: `--accent-green` left border + faint green bg tint, `+` prefix
- Unchanged: `--text-secondary`
- AI summary: `--bg-surface` inset block, `--accent-amber` `✦` icon, italic Inter 13px
- Restore button: `--accent-amber` text, right-aligned

---

### 6. AI Panel (Side Drawer)

Triggered by `✦ AI` in topbar. Slides in from right, `320px` wide, overlays DSA visualizer.

```
  ┌─────────────────────────────────────────┐
  │  ✦ AI Assistant                   [ ✕ ] │
  ├─────────────────────────────────────────┤
  │                                         │
  │  SUGGESTIONS                            │
  │  ─────────────────────────────────────  │
  │  ✦ Your note diverged significantly     │
  │    from "interview prep" — consider     │
  │    creating a branch.                   │
  │    [ Create Branch ]                    │
  │                                         │
  │  EVOLUTION ANALYSIS                     │
  │  ─────────────────────────────────────  │
  │  This note has grown from 120 to 847    │
  │  words across 14 commits over 3 days.   │
  │  Most active: System design topics.     │
  │                                         │
  │  GENERATE COMMIT MESSAGE                │
  │  ─────────────────────────────────────  │
  │  [ ✦ Generate for current changes ]     │
  │                                         │
  │  ─────────────────────────────────────  │
  │  Ask AI about your notes...             │
  │  ┌───────────────────────────────────┐  │
  │  │ /                                 │  │
  │  └───────────────────────────────────┘  │
  │  [ Send ]                               │
  └─────────────────────────────────────────┘
```

- Background: `--bg-surface`, `1px` left border `--border`
- Section headers: Inter 11px uppercase `--text-muted`
- AI output text: Inter 13px italic `--text-secondary`
- Inline action buttons: `--bg-hover` pill buttons, `--accent-amber` text
- Chat input: `--bg-card` background, monospace 13px

---

### 7. Branch Management Modal

Triggered from sidebar branch section or `⋯ More` menu.

```
  ┌──────────────────────────────────────────────┐
  │  Branch Manager                        [ ✕ ] │
  ├──────────────────────────────────────────────┤
  │                                              │
  │  Current: main                               │
  │                                              │
  │  ● main              HEAD at a3f1b2c         │
  │  ○ feature/graphs    3 commits ahead         │
  │  ○ experiment/recur  1 commit behind         │
  │                                              │
  │  [ + New Branch ]    [ ⑃ Merge Branch ]      │
  │                                              │
  │  ──────────────────────────────────────────  │
  │                                              │
  │  GRAPH PREVIEW                               │
  │  [mini branch graph renders here]            │
  │                                              │
  └──────────────────────────────────────────────┘
```

---

## Micro-interactions & Animation

| Trigger | Animation |
|---|---|
| New commit created | Linked List node slides in from right (300ms ease-out) |
| Undo | Stack top frame pops up and fades (200ms) |
| Redo | Frame slides down into stack (200ms) |
| Note opened | Hash Map slot pulses purple for 600ms |
| Branch switched | Graph re-renders, active node fills green (400ms) |
| AI suggestion | Amber pulse on `✦` icon for 2s |
| DSA panel open | Panel slides in from right (250ms ease-out) |

All animations respect `prefers-reduced-motion`.

---

## Empty States

**No notes yet:**
```
  ⎇
  
  No commits yet.
  Create your first note to begin version-controlling your thoughts.
  
  [ + New Note ]
```

**No commits on note:**
```
  This note has no history.
  Every commit you make will be tracked here.
```

**AI panel, no content changed:**
```
  Start writing or editing a note
  for AI suggestions to appear here.
```

---

## Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| `< 900px` | DSA visualizer collapses to icon-only toggle |
| `< 700px` | Sidebar collapses to icon rail |
| `< 520px` | Single-column: sidebar accessible via hamburger |

---

## Component Glossary

| Component | Description |
|---|---|
| `<NoteCard>` | Sidebar list item for a note |
| `<CommitNode>` | Node in linked list + timeline |
| `<StackFrame>` | Single undo/redo stack frame |
| `<HashBucket>` | Single slot in hash map array |
| `<BranchNode>` | Graph node for branch visualization |
| `<CommitBar>` | Bottom bar with message input and commit button |
| `<DiffModal>` | Side-by-side or inline diff view |
| `<AIPanel>` | Right drawer for AI interactions |
| `<DSAPanel>` | Right panel housing all 5 visualizers |
| `<BranchPill>` | Topbar branch selector button |

---

## Accessibility

- All interactive elements have visible focus rings (`2px solid --accent-blue`, `2px offset`)
- Color is never the sole indicator of state (icons + text supplement all color cues)
- Commit hash abbreviations have full hash in `title` attribute
- DSA animations have text equivalents in `aria-live` regions
- Editor is keyboard-navigable; commit shortcut: `Cmd/Ctrl + Enter`

---

*This document is the single source of truth for NoteGit's UI generation. All spacing, color, and type decisions derive from the tokens above.*