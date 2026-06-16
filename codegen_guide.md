# NoteGit — Developer Guide
## Frontend Generation + Backend Logic Reference
> For use inside **Antigravity IDE** with the `stitch_file_to_ui_generator` pipeline

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Directory Structure](#2-directory-structure)
3. [Frontend Generation via `stitch_file_to_ui_generator`](#3-frontend-generation-via-stitch_file_to_ui_generator)
4. [Component Generation Manifest](#4-component-generation-manifest)
5. [Backend Architecture](#5-backend-architecture)
6. [Data Structures — Implementation Logic](#6-data-structures--implementation-logic)
7. [Storage Engine](#7-storage-engine)
8. [API Layer (Local Node.js Server)](#8-api-layer-local-nodejs-server)
9. [Gemini AI Integration](#9-gemini-ai-integration)
10. [State Management](#10-state-management)
11. [Frontend ↔ Backend Contracts](#11-frontend--backend-contracts)
12. [File Watcher & Auto-Save](#12-file-watcher--auto-save)
13. [Build & Dev Commands](#13-build--dev-commands)

---

## 1. Project Overview

NoteGit is a local-first, offline note application with Git-style versioning and live DSA visualizations. It has no cloud backend, no authentication, and no external database. All data lives in JSON files on the user's machine.

**Runtime topology:**

```
┌───────────────────────────────┐
│  Antigravity IDE              │
│                               │
│  ┌────────────────────────┐   │
│  │  React Frontend        │   │
│  │  (Vite dev server)     │   │
│  │  :5173                 │   │
│  └────────────┬───────────┘   │
│               │ HTTP/REST      │
│  ┌────────────▼───────────┐   │
│  │  Node.js Local Server  │   │
│  │  Express + fs-extra    │   │
│  │  :3001                 │   │
│  └────────────┬───────────┘   │
│               │                │
│  ┌────────────▼───────────┐   │
│  │  ~/.notegit/           │   │
│  │  Local JSON Storage    │   │
│  └────────────────────────┘   │
└───────────────────────────────┘
```

---

## 2. Directory Structure

```
notegit/
├── stitch_file_to_ui_generator/        ← Stitch generation inputs live here
│   ├── notegit-ui-spec.md              ← Master UI spec (design tokens, layout)
│   ├── components.manifest.json        ← Component list for Stitch to generate
│   ├── tokens.css                      ← Design token CSS variables
│   └── screens/
│       ├── editor.screen.md            ← Per-screen generation prompt
│       ├── sidebar.screen.md
│       ├── dsa-panel.screen.md
│       ├── diff-modal.screen.md
│       ├── ai-panel.screen.md
│       └── branch-manager.screen.md
│
├── frontend/                           ← Stitch output lands here
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Topbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── AppShell.jsx
│   │   │   ├── editor/
│   │   │   │   ├── NoteEditor.jsx
│   │   │   │   ├── CommitBar.jsx
│   │   │   │   └── CommitTimeline.jsx
│   │   │   ├── dsa/
│   │   │   │   ├── DSAPanel.jsx
│   │   │   │   ├── LinkedListViz.jsx
│   │   │   │   ├── StackViz.jsx
│   │   │   │   ├── HashMapViz.jsx
│   │   │   │   ├── ArrayViz.jsx
│   │   │   │   └── GraphViz.jsx
│   │   │   ├── modals/
│   │   │   │   ├── DiffModal.jsx
│   │   │   │   └── BranchManager.jsx
│   │   │   └── ai/
│   │   │       └── AIPanel.jsx
│   │   ├── hooks/
│   │   │   ├── useNotes.js
│   │   │   ├── useCommits.js
│   │   │   ├── useBranches.js
│   │   │   ├── useUndoRedo.js
│   │   │   └── useDSAState.js
│   │   ├── store/
│   │   │   └── notegitStore.js         ← Zustand store
│   │   ├── api/
│   │   │   └── client.js               ← Axios API client
│   │   ├── styles/
│   │   │   └── tokens.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── server.js                       ← Express entry point
│   ├── routes/
│   │   ├── notes.routes.js
│   │   ├── commits.routes.js
│   │   ├── branches.routes.js
│   │   └── ai.routes.js
│   ├── controllers/
│   │   ├── notes.controller.js
│   │   ├── commits.controller.js
│   │   ├── branches.controller.js
│   │   └── ai.controller.js
│   ├── core/
│   │   ├── LinkedList.js               ← Version history DS
│   │   ├── Stack.js                    ← Undo/redo DS
│   │   ├── HashMap.js                  ← Note index DS
│   │   ├── CommitArray.js              ← Timeline DS
│   │   └── BranchGraph.js             ← Branch relationship DS
│   ├── storage/
│   │   ├── StorageEngine.js
│   │   └── migrations.js
│   ├── ai/
│   │   └── gemini.js
│   └── package.json
│
└── ~/.notegit/                         ← Runtime data (auto-created)
    ├── index.json                      ← Global note registry (HashMap)
    └── notes/
        └── {noteId}/
            ├── meta.json
            ├── branches.json
            └── commits/
                └── {commitHash}.json
```

---

## 3. Frontend Generation via `stitch_file_to_ui_generator`

### 3.1 What is `stitch_file_to_ui_generator`?

`stitch_file_to_ui_generator` is the Antigravity IDE directory that Stitch monitors to auto-generate React components. Place `.md` prompt files and a `components.manifest.json` inside it — Stitch reads them and outputs ready-to-use `.jsx` files into `frontend/src/components/`.

### 3.2 How Stitch reads the directory

```
stitch_file_to_ui_generator/
│
│  ← Stitch reads these in order:
│
├── 1. tokens.css              (design constraints — loaded first)
├── 2. notegit-ui-spec.md      (global layout, palette, type scale)
├── 3. components.manifest.json (generation queue)
└── 4. screens/*.screen.md     (per-screen detailed prompts)
```

Stitch picks up `components.manifest.json` as its task list, resolves each component against the spec file, and generates JSX with Tailwind utility classes constrained to the token set.

### 3.3 `tokens.css` — paste into `stitch_file_to_ui_generator/`

```css
:root {
  --bg-base:       #0E0F11;
  --bg-surface:    #16181C;
  --bg-card:       #1E2027;
  --bg-hover:      #252830;
  --border:        #2E3139;
  --text-primary:  #E8E9EC;
  --text-secondary:#8B8FA8;
  --text-muted:    #4A4E62;
  --accent-green:  #3DDC84;
  --accent-blue:   #5B8DEF;
  --accent-amber:  #F5A623;
  --accent-red:    #E05C5C;
  --accent-purple: #A78BFA;
  --vis-node:      #252830;
  --vis-edge:      #3DDC84;

  --font-mono: 'JetBrains Mono', monospace;
  --font-ui:   'Inter', sans-serif;

  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  16px;
}
```

### 3.4 `components.manifest.json`

```json
{
  "version": "1.0",
  "spec": "notegit-ui-spec.md",
  "tokens": "tokens.css",
  "output_dir": "../frontend/src/components",
  "framework": "react",
  "styling": "tailwind + css-variables",
  "components": [
    {
      "id": "AppShell",
      "screen": "screens/editor.screen.md",
      "output": "layout/AppShell.jsx",
      "description": "3-column root layout: Sidebar (240px) + Editor (flex) + DSAPanel (320px)",
      "props": ["children", "dsaPanelOpen", "aiPanelOpen"]
    },
    {
      "id": "Topbar",
      "screen": "screens/editor.screen.md",
      "output": "layout/Topbar.jsx",
      "description": "44px bar with NoteGit logo, branch selector pill, AI button, settings icon",
      "props": ["currentBranch", "branches", "onBranchChange", "onAIToggle", "onSettingsOpen"]
    },
    {
      "id": "Sidebar",
      "screen": "screens/sidebar.screen.md",
      "output": "layout/Sidebar.jsx",
      "description": "240px fixed sidebar with notes list, branches list, tags, new note button",
      "props": ["notes", "activeBranch", "branches", "tags", "activeNoteId", "onNoteSelect", "onNewNote", "onBranchSelect"]
    },
    {
      "id": "NoteCard",
      "screen": "screens/sidebar.screen.md",
      "output": "layout/NoteCard.jsx",
      "description": "Sidebar list item: title, branch count, commit count, active state, context menu",
      "props": ["note", "isActive", "onSelect", "onRename", "onDelete", "onCreateBranch"]
    },
    {
      "id": "NoteEditor",
      "screen": "screens/editor.screen.md",
      "output": "editor/NoteEditor.jsx",
      "description": "Main markdown editor area with title, body, line guide, unsaved indicator",
      "props": ["note", "onChange", "onTitleChange"]
    },
    {
      "id": "CommitBar",
      "screen": "screens/editor.screen.md",
      "output": "editor/CommitBar.jsx",
      "description": "Bottom bar: commit message input, Commit button, AI generate link",
      "props": ["onCommit", "onAIGenerate", "hasChanges", "isGenerating"]
    },
    {
      "id": "CommitTimeline",
      "screen": "screens/editor.screen.md",
      "output": "editor/CommitTimeline.jsx",
      "description": "Collapsible commit history list: hash, message, timestamp, restore button on hover",
      "props": ["commits", "onRestore", "onCompare", "activeCommitHash"]
    },
    {
      "id": "DSAPanel",
      "screen": "screens/dsa-panel.screen.md",
      "output": "dsa/DSAPanel.jsx",
      "description": "Right panel container with 5 visualizer cards, collapsible",
      "props": ["isOpen", "onToggle", "dsaState"]
    },
    {
      "id": "LinkedListViz",
      "screen": "screens/dsa-panel.screen.md",
      "output": "dsa/LinkedListViz.jsx",
      "description": "SVG linked list: nodes = commit hashes, arrows between nodes, HEAD highlighted",
      "props": ["commits", "headHash"]
    },
    {
      "id": "StackViz",
      "screen": "screens/dsa-panel.screen.md",
      "output": "dsa/StackViz.jsx",
      "description": "Undo stack (grows up) + redo stack, 5 visible frames, push/pop animations",
      "props": ["undoStack", "redoStack"]
    },
    {
      "id": "HashMapViz",
      "screen": "screens/dsa-panel.screen.md",
      "output": "dsa/HashMapViz.jsx",
      "description": "8-bucket hash map: bottom row of cells, active buckets highlighted purple, slot animation on note open",
      "props": ["noteIndex", "activeNoteId"]
    },
    {
      "id": "ArrayViz",
      "screen": "screens/dsa-panel.screen.md",
      "output": "dsa/ArrayViz.jsx",
      "description": "Horizontal indexed array of commits, HEAD arrow below index 0, slide animation on new commit",
      "props": ["commits", "headIndex"]
    },
    {
      "id": "GraphViz",
      "screen": "screens/dsa-panel.screen.md",
      "output": "dsa/GraphViz.jsx",
      "description": "SVG branch graph: nodes for commits, edges for parent relationships, branch labels",
      "props": ["branches", "activeBranch", "commits"]
    },
    {
      "id": "DiffModal",
      "screen": "screens/diff-modal.screen.md",
      "output": "modals/DiffModal.jsx",
      "description": "Full diff view modal: removed lines red, added lines green, AI summary block, Restore button",
      "props": ["fromCommit", "toCommit", "diff", "aiSummary", "onRestore", "onClose"]
    },
    {
      "id": "BranchManager",
      "screen": "screens/branch-manager.screen.md",
      "output": "modals/BranchManager.jsx",
      "description": "Branch list modal: current branch, branch status, create/merge actions, mini graph preview",
      "props": ["branches", "activeBranch", "onCreate", "onMerge", "onSwitch", "onClose"]
    },
    {
      "id": "AIPanel",
      "screen": "screens/ai-panel.screen.md",
      "output": "ai/AIPanel.jsx",
      "description": "Right drawer: suggestions, evolution analysis, generate commit message, chat input",
      "props": ["suggestions", "evolution", "onGenerate", "onChat", "chatHistory", "isLoading"]
    }
  ]
}
```

### 3.5 Screen prompt files (place in `stitch_file_to_ui_generator/screens/`)

Each `.screen.md` file is a focused Stitch generation prompt. Below is the template and all 6 files.

---

**`screens/editor.screen.md`**

```markdown
# Screen: Editor Area

## Context
Central column of NoteGit's 3-column layout. Width: flex (min 480px).
Background: var(--bg-base). Padding: 48px 56px.

## Components to generate: AppShell, Topbar, NoteEditor, CommitBar, CommitTimeline

## AppShell
- CSS grid: `grid-template-columns: 240px 1fr 320px`
- Topbar spans full width: `grid-column: 1 / -1`
- Sidebar: column 1
- Editor + CommitBar + Timeline: column 2, flex-column
- DSAPanel: column 3

## Topbar
- Height 44px, bg var(--bg-surface), border-bottom 1px var(--border)
- Left: ⎇ icon + "NoteGit" text, font-family var(--font-mono), font-weight 600
- Center: branch selector pill — bg var(--bg-card), color var(--accent-blue), chevron-down icon
- Right: "✦ AI" button (color var(--accent-amber) on hover glow), ⚙ icon button

## NoteEditor
- Title: contenteditable div, font-mono 600 24px, var(--text-primary), no border, full width
- Divider: 1px var(--border) below title
- Body: textarea or contenteditable, font-mono 400 14px, line-height 1.8
- Left margin guide: 1px var(--border) at 20px from left
- Placeholder: "Start writing... (Markdown supported)" in var(--text-muted)

## CommitBar
- Fixed to bottom of editor column
- bg var(--bg-surface), border-top 1px var(--border), padding 12px 16px
- Left: ○ indicator dot (green if changes exist) + text input placeholder "Commit message..."
- Right: "Commit ✓" button — bg var(--accent-green), color #0E0F11, font-mono 600
- Below input: "✦ Generate with AI" small link, color var(--accent-amber), only visible when hasChanges=true

## CommitTimeline
- Collapsible section below CommitBar
- Header: "HISTORY" label (11px Inter uppercase var(--text-muted)) + ↕ toggle button
- Each row: ● dot + 7-char hash + commit message + timestamp
- Dot color: var(--accent-green) for normal, var(--accent-blue) for branch points
- Hover on row: show "Restore" button right-aligned, color var(--accent-amber)
- Click row: fires onCompare(commit)
```

---

**`screens/sidebar.screen.md`**

```markdown
# Screen: Sidebar

## Context
Left column, 240px fixed. bg var(--bg-surface). border-right 1px var(--border).

## Components: Sidebar, NoteCard

## Sidebar layout (flex-column, full height)
1. New Note button — full width, dashed border var(--border), + icon var(--accent-green)
2. "NOTES" section label — 11px Inter uppercase var(--text-muted), padding 16px 16px 8px
3. Notes list — NoteCard list, scrollable
4. "BRANCHES" section label
5. Branch list items: ● (green = active) / ○ + branch name, font-mono 13px
6. "TAGS" section label
7. Tag pills: var(--bg-card) background, var(--text-secondary), 4px radius

## NoteCard
- Padding: 8px 16px
- Title: font-mono 14px var(--text-primary)
- Subtitle: "N branches · N commits" — 11px Inter var(--text-muted)
- Active state: 2px left border var(--accent-green), bg var(--bg-hover)
- Hover: bg var(--bg-hover)
- Right-click context menu: Rename | Delete | Create Branch | View History
  - Menu bg: var(--bg-card), border var(--border), shadow
```

---

**`screens/dsa-panel.screen.md`**

```markdown
# Screen: DSA Visualizer Panel

## Context
Right column, 320px. bg var(--bg-surface). border-left 1px var(--border).
Header: "DSA VISUALIZER" — 11px Inter uppercase var(--text-muted), letterspacing 0.1em.

## Each visualizer is a card: bg var(--bg-card), border 1px var(--border), radius var(--radius-md), padding 12px, margin-bottom 12px

## LinkedListViz
- SVG container, height ~80px
- Nodes: rect rx=6, fill var(--vis-node), stroke var(--border), width 64px, height 28px
- Text inside node: 10px font-mono, fill var(--text-secondary), 7-char hash
- Arrows: line or path, stroke var(--vis-edge), marker-end arrowhead
- Active (HEAD) node: stroke var(--accent-green), stroke-width 2
- Animation: on new commit, new node translates in from right (300ms ease-out)

## StackViz
- Two columns: "UNDO" + "REDO" labels
- Each column: flex-column-reverse (stack grows up visually)
- Frames: bg var(--bg-card), border 1px var(--border), padding 6px 10px, font-mono 11px var(--text-secondary)
- Max 5 frames visible; overflow fades
- Push animation: new frame slides down into position (200ms)
- Pop animation: top frame moves up and opacity 0 (200ms)

## HashMapViz
- Top: "hash(noteName) → slot N" in 11px mono var(--text-muted)
- Bottom: 8 equal-width cells in a row, each 30px wide, height 24px
- Cell: border 1px var(--border), bg var(--vis-node)
- Filled cell: bg var(--accent-purple), opacity 0.8
- On note open: filled cell pulses (scale 1.1 → 1.0, 600ms)

## ArrayViz
- Horizontal row of commit cells, index labels above each cell
- Cell: 56px wide, border 1px var(--border), bg var(--vis-node), font-mono 10px
- Index label: var(--text-muted) 10px above cell
- HEAD pointer: ▲ arrow below index-0 cell, color var(--accent-green)
- New commit animation: all cells translate right 56px, new cell appears at left

## GraphViz
- SVG, auto-height based on branch count
- Commit nodes: circle r=6, fill var(--vis-node), stroke var(--vis-edge)
- Branch edges: path stroke var(--vis-edge) stroke-width 1.5
- Branch labels: font-ui 11px var(--text-secondary) to the right of each node
- Active branch node: fill var(--accent-green)
- Merge node: double circle (two concentric)
```

---

**`screens/diff-modal.screen.md`**

```markdown
# Screen: Diff Modal

## Context
Centered modal, max-width 680px. bg var(--bg-card). radius var(--radius-lg). Overlay: rgba(0,0,0,0.6).

## Header
- "Compare: {fromHash} → {toHash}" — font-mono 14px var(--text-primary)
- ✕ close button top-right

## Diff body
- Line-by-line rendering, font-mono 13px, line-height 1.7
- Removed line: bg rgba(224,92,92,0.1), left border 2px var(--accent-red), "−" prefix var(--accent-red)
- Added line: bg rgba(61,220,132,0.1), left border 2px var(--accent-green), "+" prefix var(--accent-green)
- Unchanged line: var(--text-secondary), no border

## AI Summary block
- bg var(--bg-surface), border-top 1px var(--border), padding 12px 16px
- "✦" icon var(--accent-amber) + italic Inter 13px var(--text-secondary) text

## Footer
- Left: "← Older" link, var(--text-muted)
- Right: "Restore This Version" button, var(--accent-amber) text, var(--bg-hover) bg
```

---

**`screens/ai-panel.screen.md`**

```markdown
# Screen: AI Panel

## Context
Right-side drawer, 320px. Slides in over DSA panel (z-index above). bg var(--bg-surface). border-left 1px var(--border).

## Header
- "✦ AI Assistant" — font-mono 600 14px var(--text-primary)
- ✕ close, right-aligned

## Section: SUGGESTIONS
- Label: 11px Inter uppercase var(--text-muted)
- Card: bg var(--bg-card), radius var(--radius-md), padding 12px
- "✦" icon var(--accent-amber) + suggestion text Inter 13px italic var(--text-secondary)
- Inline action button: "Create Branch" — var(--bg-hover) bg, var(--accent-amber) text, radius var(--radius-sm)

## Section: EVOLUTION ANALYSIS
- Same card style, stat text Inter 13px var(--text-secondary)

## Section: GENERATE COMMIT MESSAGE
- "✦ Generate for current changes" — full-width button, dashed border var(--accent-amber), var(--accent-amber) text, font-mono 13px

## Section: Chat
- Divider 1px var(--border)
- "Ask AI about your notes..." — 11px Inter var(--text-muted) label
- Textarea: bg var(--bg-card), border var(--border), font-mono 13px, radius var(--radius-sm)
- "Send" button: bg var(--accent-green), color #0E0F11, font-mono 600
```

---

**`screens/branch-manager.screen.md`**

```markdown
# Screen: Branch Manager Modal

## Context
Centered modal, max-width 520px. bg var(--bg-card). radius var(--radius-lg).

## Header
- "Branch Manager" — font-mono 600 16px var(--text-primary)
- "Current: {branchName}" — 12px Inter var(--text-muted)

## Branch list
- Each row: ● (active, var(--accent-green)) or ○ + branch name (font-mono 14px) + status ("HEAD at {hash}" / "N commits ahead") right-aligned var(--text-muted) 11px
- Click row: switches to that branch

## Actions
- "＋ New Branch" button: bg var(--bg-hover), border 1px var(--border), font-mono 13px
- "⑃ Merge Branch" button: same style, var(--accent-blue) icon

## Graph preview
- Label: "GRAPH PREVIEW" — 11px uppercase var(--text-muted)
- Renders GraphViz component inline, height 120px
```

---

## 4. Component Generation Manifest

Stitch processes `components.manifest.json` top-down. Generation order matters — layout components first, then leaf components.

**Generation order:**
```
1. AppShell       (root container)
2. Topbar
3. Sidebar + NoteCard
4. NoteEditor
5. CommitBar
6. CommitTimeline
7. DSAPanel       (container)
8. LinkedListViz, StackViz, HashMapViz, ArrayViz, GraphViz
9. DiffModal
10. BranchManager
11. AIPanel
```

After Stitch generates all components, wire them in `frontend/src/main.jsx`:

```jsx
// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import AppShell from './components/layout/AppShell'
import '../styles/tokens.css'

ReactDOM.createRoot(document.getElementById('root')).render(<AppShell />)
```

---

## 5. Backend Architecture

### 5.1 `backend/server.js` — Express entry point

```javascript
import express from 'express'
import cors from 'cors'
import notesRouter from './routes/notes.routes.js'
import commitsRouter from './routes/commits.routes.js'
import branchesRouter from './routes/branches.routes.js'
import aiRouter from './routes/ai.routes.js'
import { StorageEngine } from './storage/StorageEngine.js'

const app = express()
const PORT = 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Initialize storage on startup
await StorageEngine.init()

app.use('/api/notes',    notesRouter)
app.use('/api/commits',  commitsRouter)
app.use('/api/branches', branchesRouter)
app.use('/api/ai',       aiRouter)

app.listen(PORT, () => console.log(`NoteGit backend running on :${PORT}`))
```

---

## 6. Data Structures — Implementation Logic

### 6.1 `core/LinkedList.js` — Version History

Every note's commit history is a singly linked list. HEAD points to the latest commit; each node stores a pointer to its parent hash.

```javascript
// core/LinkedList.js
export class CommitNode {
  constructor(hash, message, content, parentHash = null, timestamp = Date.now()) {
    this.hash      = hash         // 7-char hex, e.g. "a3f1b2c"
    this.message   = message
    this.content   = content      // full note text at this commit
    this.parent    = parentHash   // null for root commit
    this.timestamp = timestamp
    this.branch    = null         // set when node is on a named branch
  }
}

export class CommitLinkedList {
  constructor() {
    this.head = null   // most recent commit
    this.size = 0
  }

  // O(1) — prepend new commit
  push(hash, message, content, parentHash) {
    const node = new CommitNode(hash, message, content, parentHash)
    node.next  = this.head
    this.head  = node
    this.size++
    return node
  }

  // O(n) — walk list to find a commit by hash
  findByHash(hash) {
    let current = this.head
    while (current) {
      if (current.hash === hash) return current
      current = current.next
    }
    return null
  }

  // O(n) — serialize to array for API responses and ArrayViz
  toArray() {
    const result = []
    let current  = this.head
    while (current) {
      result.push({
        hash:      current.hash,
        message:   current.message,
        parent:    current.parent,
        timestamp: current.timestamp
      })
      current = current.next
    }
    return result  // index 0 = HEAD
  }

  // O(n) — restore note content to a specific commit
  restoreTo(hash) {
    const node = this.findByHash(hash)
    if (!node) throw new Error(`Commit ${hash} not found`)
    return node.content
  }
}
```

**Serialization to disk:** Each commit node maps to `~/.notegit/notes/{noteId}/commits/{hash}.json`.

---

### 6.2 `core/Stack.js` — Undo / Redo

Two stacks track editing operations. On every keystroke batch (debounced 500ms), a snapshot is pushed. Undo pops from the undo stack and pushes to redo.

```javascript
// core/Stack.js
export class Stack {
  constructor(maxSize = 50) {
    this.items   = []
    this.maxSize = maxSize
  }

  // O(1)
  push(item) {
    if (this.items.length >= this.maxSize) {
      this.items.shift()   // evict oldest (bottom of stack)
    }
    this.items.push(item)
  }

  // O(1)
  pop() {
    if (this.isEmpty()) return null
    return this.items.pop()
  }

  // O(1)
  peek() {
    return this.items[this.items.length - 1] ?? null
  }

  isEmpty()  { return this.items.length === 0 }
  size()     { return this.items.length }

  // Returns top N frames for StackViz
  topFrames(n = 5) {
    return this.items.slice(-n).reverse()  // [top, ..., bottom]
  }

  clear() { this.items = [] }
}

// Usage in editor
export class UndoRedoManager {
  constructor() {
    this.undoStack = new Stack()
    this.redoStack = new Stack()
  }

  // Call on every debounced content change
  recordChange(snapshot) {
    this.undoStack.push(snapshot)
    this.redoStack.clear()         // new change invalidates redo history
  }

  undo(currentContent) {
    if (this.undoStack.isEmpty()) return currentContent
    const prev = this.undoStack.pop()
    this.redoStack.push(currentContent)
    return prev
  }

  redo(currentContent) {
    if (this.redoStack.isEmpty()) return currentContent
    const next = this.redoStack.pop()
    this.undoStack.push(currentContent)
    return next
  }

  // Shape sent to StackViz
  getVisualizerState() {
    return {
      undoStack: this.undoStack.topFrames(5),
      redoStack: this.redoStack.topFrames(5)
    }
  }
}
```

**Frontend integration:** `useUndoRedo.js` hook calls `Ctrl+Z` / `Ctrl+Shift+Z`, hits `/api/notes/:id/undo` or `/api/notes/:id/redo`, and dispatches the updated DSA state to the store.

---

### 6.3 `core/HashMap.js` — Note Index

A custom hash map indexes notes by name for O(1) average lookup. Uses djb2 hashing + separate chaining for collisions.

```javascript
// core/HashMap.js
export class HashMap {
  constructor(buckets = 8) {
    this.buckets  = new Array(buckets).fill(null).map(() => [])
    this.size     = 0
    this.capacity = buckets
  }

  // djb2 hash function
  _hash(key) {
    let hash = 5381
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) + hash) + key.charCodeAt(i)
      hash = hash & hash  // convert to 32-bit int
    }
    return Math.abs(hash) % this.capacity
  }

  // O(1) average — store noteId by note title
  set(key, value) {
    const index  = this._hash(key)
    const bucket = this.buckets[index]
    const existing = bucket.find(([k]) => k === key)

    if (existing) {
      existing[1] = value
    } else {
      bucket.push([key, value])
      this.size++

      // Resize if load factor > 0.75
      if (this.size / this.capacity > 0.75) this._resize()
    }

    return { slot: index, key, value }  // returned to visualizer
  }

  // O(1) average
  get(key) {
    const index  = this._hash(key)
    const bucket = this.buckets[index]
    const pair   = bucket.find(([k]) => k === key)
    return pair ? pair[1] : null
  }

  // O(1) average
  delete(key) {
    const index  = this._hash(key)
    const bucket = this.buckets[index]
    const i      = bucket.findIndex(([k]) => k === key)
    if (i > -1) { bucket.splice(i, 1); this.size-- }
  }

  _resize() {
    const old         = this.buckets
    this.capacity    *= 2
    this.buckets      = new Array(this.capacity).fill(null).map(() => [])
    this.size         = 0
    old.forEach(bucket => bucket.forEach(([k, v]) => this.set(k, v)))
  }

  // Shape sent to HashMapViz
  getVisualizerState() {
    return {
      buckets:  this.buckets.map((b, i) => ({ index: i, entries: b.map(([k]) => k), filled: b.length > 0 })),
      capacity: this.capacity,
      size:     this.size
    }
  }
}
```

---

### 6.4 `core/CommitArray.js` — Timeline

A simple managed array wrapping the commit list for the ArrayViz.

```javascript
// core/CommitArray.js
export class CommitArray {
  constructor() {
    this.items = []  // items[0] = HEAD (most recent)
  }

  prepend(commit) {
    this.items.unshift(commit)  // new commit goes to index 0
  }

  getAtIndex(i) {
    return this.items[i] ?? null
  }

  // Shape sent to ArrayViz — first 8 commits visible
  getVisualizerState() {
    return {
      commits:   this.items.slice(0, 8).map((c, i) => ({
        index:   i,
        hash:    c.hash,
        message: c.message.slice(0, 24) + (c.message.length > 24 ? '…' : '')
      })),
      headIndex: 0,
      total:     this.items.length
    }
  }
}
```

---

### 6.5 `core/BranchGraph.js` — Branch Relationships

A directed acyclic graph (DAG) where nodes are commits and edges are parent→child relationships. Branches are named pointers to nodes.

```javascript
// core/BranchGraph.js
export class BranchGraph {
  constructor() {
    this.nodes    = new Map()   // hash → { hash, message, parents[], branches[] }
    this.branches = new Map()   // branchName → headHash
    this.HEAD     = 'main'
  }

  addCommit(hash, message, parentHashes = []) {
    this.nodes.set(hash, {
      hash,
      message,
      parents:  parentHashes,
      branches: []
    })
    // back-link from parent → child
    parentHashes.forEach(p => {
      if (this.nodes.has(p)) {
        const parent = this.nodes.get(p)
        parent.children = parent.children ?? []
        parent.children.push(hash)
      }
    })
  }

  createBranch(name, fromHash) {
    if (this.branches.has(name)) throw new Error(`Branch "${name}" already exists`)
    this.branches.set(name, fromHash)
    const node = this.nodes.get(fromHash)
    if (node) node.branches.push(name)
  }

  switchBranch(name) {
    if (!this.branches.has(name)) throw new Error(`Branch "${name}" not found`)
    this.HEAD = name
    return this.branches.get(name)  // returns HEAD hash of that branch
  }

  // Three-way merge: finds common ancestor, applies changes
  merge(sourceBranch, targetBranch = this.HEAD) {
    const sourceHead = this.branches.get(sourceBranch)
    const targetHead = this.branches.get(targetBranch)
    const ancestor   = this._findCommonAncestor(sourceHead, targetHead)
    return { sourceHead, targetHead, ancestor }
  }

  _findCommonAncestor(hashA, hashB) {
    const visitedA = new Set()
    const queueA   = [hashA]
    while (queueA.length) {
      const h = queueA.shift()
      visitedA.add(h)
      const node = this.nodes.get(h)
      if (node) node.parents.forEach(p => queueA.push(p))
    }
    const queueB = [hashB]
    while (queueB.length) {
      const h = queueB.shift()
      if (visitedA.has(h)) return h
      const node = this.nodes.get(h)
      if (node) node.parents.forEach(p => queueB.push(p))
    }
    return null
  }

  // Shape sent to GraphViz
  getVisualizerState() {
    const nodeList = Array.from(this.nodes.values()).map(n => ({
      id:       n.hash,
      label:    n.hash.slice(0, 7),
      branches: n.branches,
      parents:  n.parents
    }))

    const edgeList = []
    this.nodes.forEach(n => {
      n.parents.forEach(p => edgeList.push({ from: p, to: n.hash }))
    })

    return {
      nodes:          nodeList,
      edges:          edgeList,
      branches:       Object.fromEntries(this.branches),
      activeBranch:   this.HEAD
    }
  }
}
```

---

## 7. Storage Engine

```javascript
// backend/storage/StorageEngine.js
import fs   from 'fs-extra'
import path from 'path'
import os   from 'os'

const ROOT = path.join(os.homedir(), '.notegit')

export const StorageEngine = {
  // Creates ~/.notegit/ and index.json if they don't exist
  async init() {
    await fs.ensureDir(path.join(ROOT, 'notes'))
    const indexPath = path.join(ROOT, 'index.json')
    if (!await fs.pathExists(indexPath)) {
      await fs.writeJSON(indexPath, { notes: {}, version: 1 })
    }
  },

  // --- Note operations ---

  async createNote(noteId, title) {
    const noteDir = path.join(ROOT, 'notes', noteId)
    await fs.ensureDir(path.join(noteDir, 'commits'))
    await fs.writeJSON(path.join(noteDir, 'meta.json'), {
      id: noteId, title, createdAt: Date.now(), branches: { main: null }
    })
    await this._updateIndex(noteId, title)
    return noteId
  },

  async getNote(noteId) {
    const meta = await fs.readJSON(path.join(ROOT, 'notes', noteId, 'meta.json'))
    return meta
  },

  async getAllNotes() {
    const index = await fs.readJSON(path.join(ROOT, 'index.json'))
    return index.notes
  },

  async deleteNote(noteId) {
    await fs.remove(path.join(ROOT, 'notes', noteId))
    await this._removeFromIndex(noteId)
  },

  // --- Commit operations ---

  async saveCommit(noteId, commit) {
    const filePath = path.join(ROOT, 'notes', noteId, 'commits', `${commit.hash}.json`)
    await fs.writeJSON(filePath, commit)

    // Update branch pointer in meta.json
    const meta = await this.getNote(noteId)
    const branch = meta.currentBranch ?? 'main'
    meta.branches[branch] = commit.hash
    await fs.writeJSON(path.join(ROOT, 'notes', noteId, 'meta.json'), meta)
  },

  async getCommit(noteId, hash) {
    return fs.readJSON(path.join(ROOT, 'notes', noteId, 'commits', `${hash}.json`))
  },

  async getAllCommits(noteId) {
    const dir   = path.join(ROOT, 'notes', noteId, 'commits')
    const files = await fs.readdir(dir)
    const commits = await Promise.all(
      files.map(f => fs.readJSON(path.join(dir, f)))
    )
    return commits.sort((a, b) => b.timestamp - a.timestamp)
  },

  // --- Index management ---

  async _updateIndex(noteId, title) {
    const indexPath = path.join(ROOT, 'index.json')
    const index     = await fs.readJSON(indexPath)
    index.notes[noteId] = { id: noteId, title, updatedAt: Date.now() }
    await fs.writeJSON(indexPath, index)
  },

  async _removeFromIndex(noteId) {
    const indexPath = path.join(ROOT, 'index.json')
    const index     = await fs.readJSON(indexPath)
    delete index.notes[noteId]
    await fs.writeJSON(indexPath, index)
  }
}
```

---

## 8. API Layer (Local Node.js Server)

### Routes overview

| Method | Endpoint | Action |
|---|---|---|
| `GET` | `/api/notes` | List all notes |
| `POST` | `/api/notes` | Create note |
| `GET` | `/api/notes/:id` | Get note meta |
| `DELETE` | `/api/notes/:id` | Delete note |
| `GET` | `/api/notes/:id/commits` | Get commit history |
| `POST` | `/api/notes/:id/commits` | Create commit |
| `GET` | `/api/notes/:id/commits/:hash` | Get single commit |
| `POST` | `/api/notes/:id/restore/:hash` | Restore to commit |
| `GET` | `/api/notes/:id/diff` | Diff two commits |
| `POST` | `/api/notes/:id/undo` | Undo last change |
| `POST` | `/api/notes/:id/redo` | Redo |
| `GET` | `/api/branches/:noteId` | List branches |
| `POST` | `/api/branches/:noteId` | Create branch |
| `POST` | `/api/branches/:noteId/switch` | Switch branch |
| `POST` | `/api/branches/:noteId/merge` | Merge branches |
| `POST` | `/api/ai/commit-message` | Generate commit message |
| `POST` | `/api/ai/diff-summary` | Summarize diff |
| `POST` | `/api/ai/evolution` | Analyze note evolution |
| `POST` | `/api/ai/suggest-branch` | Suggest branch creation |
| `POST` | `/api/ai/chat` | Open-ended note chat |

### Key controller: `commits.controller.js`

```javascript
import crypto from 'crypto'
import { StorageEngine }   from '../storage/StorageEngine.js'
import { CommitLinkedList } from '../core/LinkedList.js'
import { CommitArray }      from '../core/CommitArray.js'

// In-memory per-note state (persisted to disk on change)
const noteState = new Map()  // noteId → { list, array }

async function getNoteState(noteId) {
  if (!noteState.has(noteId)) {
    const commits = await StorageEngine.getAllCommits(noteId)
    const list    = new CommitLinkedList()
    const array   = new CommitArray()
    // Re-hydrate ordered list from disk (most recent first)
    commits.forEach(c => { list.push(c.hash, c.message, c.content, c.parent); array.prepend(c) })
    noteState.set(noteId, { list, array })
  }
  return noteState.get(noteId)
}

export async function createCommit(req, res) {
  const { id }                = req.params
  const { message, content }  = req.body

  const hash   = crypto.createHash('sha1')
                   .update(content + Date.now())
                   .digest('hex')
                   .slice(0, 7)

  const { list, array } = await getNoteState(id)
  const parentHash      = list.head?.hash ?? null

  const commit = { hash, message, content, parent: parentHash, timestamp: Date.now() }

  list.push(hash, message, content, parentHash)
  array.prepend(commit)
  await StorageEngine.saveCommit(id, commit)

  res.json({
    commit,
    dsa: {
      linkedList: list.toArray(),
      array:      array.getVisualizerState()
    }
  })
}

export async function getCommits(req, res) {
  const { id } = req.params
  const { list, array } = await getNoteState(id)
  res.json({
    commits: list.toArray(),
    dsa: {
      linkedList: list.toArray(),
      array:      array.getVisualizerState()
    }
  })
}

export async function restoreCommit(req, res) {
  const { id, hash } = req.params
  const { list }     = await getNoteState(id)
  const content      = list.restoreTo(hash)
  res.json({ content, restoredHash: hash })
}

export async function diffCommits(req, res) {
  const { id }           = req.params
  const { fromHash, toHash } = req.query
  const { list }         = await getNoteState(id)

  const fromNode = list.findByHash(fromHash)
  const toNode   = list.findByHash(toHash)

  if (!fromNode || !toNode) return res.status(404).json({ error: 'Commit not found' })

  const diff = computeDiff(fromNode.content, toNode.content)
  res.json({ diff, from: fromHash, to: toHash })
}

// Line-level diff (Myers algorithm simplified)
function computeDiff(oldText, newText) {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const result   = []

  const maxLen = Math.max(oldLines.length, newLines.length)
  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i]
    const n = newLines[i]
    if (o === n)       result.push({ type: 'unchanged', content: o ?? '' })
    else if (o == null) result.push({ type: 'added',   content: n })
    else if (n == null) result.push({ type: 'removed', content: o })
    else {
      result.push({ type: 'removed', content: o })
      result.push({ type: 'added',   content: n })
    }
  }
  return result
}
```

---

## 9. Gemini AI Integration

```javascript
// backend/ai/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

export const GeminiAI = {
  async generateCommitMessage(before, after) {
    const prompt = `You are a Git commit message generator for a personal notes app.
Given the following change to a note, write a concise commit message (max 60 chars).
Only output the message, no explanation.

BEFORE:
${before.slice(0, 500)}

AFTER:
${after.slice(0, 500)}`

    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  },

  async summarizeDiff(diff) {
    const diffText = diff
      .map(l => `${l.type === 'added' ? '+' : l.type === 'removed' ? '-' : ' '} ${l.content}`)
      .join('\n')

    const prompt = `Summarize this note diff in 1-2 sentences. Be specific about what changed.

${diffText.slice(0, 1000)}`

    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  },

  async analyzeEvolution(commits) {
    const summary = commits.slice(0, 10).map(c =>
      `[${new Date(c.timestamp).toLocaleDateString()}] ${c.message}`
    ).join('\n')

    const prompt = `Analyze how this note has evolved over time based on commit history.
Provide 2-3 sentences about the progression of ideas, growth, and focus areas.

COMMIT HISTORY (most recent first):
${summary}`

    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  },

  async suggestBranch(currentContent, recentCommits) {
    const prompt = `You are an AI assistant for a note-taking app with Git-style branching.
Based on the note content and recent changes, decide if a new branch should be created.
If yes, suggest a branch name (kebab-case, max 30 chars) and reason.
If no, output "NO_BRANCH".

RECENT COMMITS:
${recentCommits.slice(0, 5).map(c => c.message).join('\n')}

CURRENT CONTENT PREVIEW:
${currentContent.slice(0, 400)}`

    const result  = await model.generateContent(prompt)
    const text    = result.response.text().trim()
    if (text === 'NO_BRANCH') return null
    const [name, ...reasonParts] = text.split('\n')
    return { name: name.trim(), reason: reasonParts.join(' ').trim() }
  },

  async chat(question, noteContext) {
    const prompt = `You are an AI assistant helping a user understand and improve their notes.
Answer the following question about their note content concisely (2-4 sentences).

NOTE CONTENT:
${noteContext.slice(0, 1000)}

QUESTION: ${question}`

    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  }
}
```

**`.env` file in `backend/`:**

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

---

## 10. State Management

### `frontend/src/store/notegitStore.js` (Zustand)

```javascript
import { create } from 'zustand'

export const useNoteGitStore = create((set, get) => ({
  // --- Note state ---
  notes:         {},        // { [noteId]: noteMeta }
  activeNoteId:  null,
  noteContent:   '',
  noteTitle:     '',
  hasUnsavedChanges: false,

  // --- Branch state ---
  activeBranch:  'main',
  branches:      ['main'],

  // --- Commit state ---
  commits:       [],        // ordered array, commits[0] = HEAD

  // --- DSA visualizer state ---
  dsaState: {
    linkedList: [],         // [ { hash, message, parent } ]
    undoStack:  [],         // top 5 frames
    redoStack:  [],
    hashMap:    { buckets: [], capacity: 8, size: 0 },
    array:      { commits: [], headIndex: 0 },
    graph:      { nodes: [], edges: [], branches: {}, activeBranch: 'main' }
  },

  // --- UI state ---
  dsaPanelOpen:  true,
  aiPanelOpen:   false,
  diffModalOpen: false,
  diffData:      null,

  // --- Actions ---
  setActiveNote:    (id) => set({ activeNoteId: id }),
  setNoteContent:   (c)  => set({ noteContent: c, hasUnsavedChanges: true }),
  setDSAState:      (ds) => set(s => ({ dsaState: { ...s.dsaState, ...ds } })),
  toggleDSAPanel:   ()   => set(s => ({ dsaPanelOpen: !s.dsaPanelOpen })),
  toggleAIPanel:    ()   => set(s => ({ aiPanelOpen:  !s.aiPanelOpen })),
  openDiffModal:    (d)  => set({ diffModalOpen: true, diffData: d }),
  closeDiffModal:   ()   => set({ diffModalOpen: false, diffData: null }),
  clearUnsaved:     ()   => set({ hasUnsavedChanges: false }),
}))
```

---

## 11. Frontend ↔ Backend Contracts

### POST `/api/notes/:id/commits`

**Request:**
```json
{
  "message": "Added CAP theorem section",
  "content": "# System Design\n\n## CAP Theorem\n..."
}
```

**Response:**
```json
{
  "commit": {
    "hash":      "a3f1b2c",
    "message":   "Added CAP theorem section",
    "parent":    "c9d42e1",
    "timestamp": 1718500000000
  },
  "dsa": {
    "linkedList": [
      { "hash": "a3f1b2c", "message": "Added CAP theorem section", "parent": "c9d42e1" },
      { "hash": "c9d42e1", "message": "Initial draft", "parent": null }
    ],
    "array": {
      "commits": [
        { "index": 0, "hash": "a3f1b2c", "message": "Added CAP theorem sec…" },
        { "index": 1, "hash": "c9d42e1", "message": "Initial draft" }
      ],
      "headIndex": 0,
      "total": 2
    }
  }
}
```

### GET `/api/notes/:id/diff?fromHash=c9d42e1&toHash=a3f1b2c`

**Response:**
```json
{
  "from": "c9d42e1",
  "to":   "a3f1b2c",
  "diff": [
    { "type": "unchanged", "content": "# System Design" },
    { "type": "unchanged", "content": "" },
    { "type": "added",     "content": "## CAP Theorem" },
    { "type": "added",     "content": "" },
    { "type": "added",     "content": "Consistency, Availability, Partition tolerance." }
  ]
}
```

### POST `/api/ai/commit-message`

**Request:**
```json
{ "before": "old content...", "after": "new content..." }
```

**Response:**
```json
{ "message": "Added CAP theorem section with examples" }
```

---

## 12. File Watcher & Auto-Save

```javascript
// backend/storage/watcher.js — watches the JSON repo for external changes
import chokidar from 'chokidar'
import path     from 'path'
import os       from 'os'

const ROOT = path.join(os.homedir(), '.notegit')

export function startWatcher(io) {  // io = socket.io instance for push to frontend
  chokidar.watch(ROOT, { ignoreInitial: true }).on('change', (filePath) => {
    const parts  = filePath.split(path.sep)
    const noteId = parts[parts.indexOf('notes') + 1]
    if (noteId) {
      io.emit('note:changed', { noteId })  // frontend re-fetches
    }
  })
}
```

Auto-save from frontend: debounce 800ms on content change → store in local state only. Only persist to disk on explicit Commit action.

---

## 13. Build & Dev Commands

```bash
# Install all dependencies
cd backend  && npm install
cd frontend && npm install

# Dev mode (run both together)
npm run dev          # from root — starts both via concurrently

# Or individually:
node backend/server.js          # :3001
cd frontend && npx vite         # :5173

# Production build
cd frontend && npx vite build   # outputs to frontend/dist/
# Then serve dist/ via Express static:
app.use(express.static(path.join(__dirname, '../frontend/dist')))
```

**`root/package.json`:**

```json
{
  "name": "notegit",
  "scripts": {
    "dev": "concurrently \"node backend/server.js\" \"cd frontend && vite\"",
    "build": "cd frontend && vite build"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

**`backend/package.json` key dependencies:**

```json
{
  "dependencies": {
    "express":               "^4.18.0",
    "cors":                  "^2.8.5",
    "fs-extra":              "^11.0.0",
    "@google/generative-ai": "^0.1.0",
    "chokidar":              "^3.5.0",
    "socket.io":             "^4.6.0"
  }
}
```

**`frontend/package.json` key dependencies:**

```json
{
  "dependencies": {
    "react":     "^18.0.0",
    "react-dom": "^18.0.0",
    "zustand":   "^4.4.0",
    "axios":     "^1.4.0"
  },
  "devDependencies": {
    "vite":                "^5.0.0",
    "@vitejs/plugin-react":"^4.0.0",
    "tailwindcss":         "^3.4.0"
  }
}
```

---

*This guide is the single implementation reference for NoteGit inside Antigravity IDE. All data structure implementations derive from `backend/core/`. All UI components derive from `stitch_file_to_ui_generator/`. The two layers communicate exclusively via the REST contracts in §11.*