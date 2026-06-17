<p align="center">
  <img src="https://img.shields.io/badge/NoteGit-v1.0-00e5a0?style=for-the-badge&labelColor=0d1117" alt="NoteGit v1.0" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white&labelColor=0d1117" alt="React 18" />
  <img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white&labelColor=0d1117" alt="Express 4" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white&labelColor=0d1117" alt="Gemini AI" />
</p>

# 📓 NoteGit — Version-Controlled Notes with Live DSA Visualizations

**NoteGit** is a local-first, offline note-taking application that brings the power of **Git version control** to your notes — with **real-time, interactive Data Structure & Algorithm (DSA) visualizations** that show you *exactly* how Git operations work under the hood.

Every time you create a note, make an edit, commit a snapshot, branch, merge, undo, or redo — NoteGit renders the corresponding data structure transformations live on screen using animated SVG visualizers.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NoteGit Monorepo                         │
├──────────────────────────┬──────────────────────────────────────┤
│     Frontend (React)     │          Backend (Express)           │
│                          │                                      │
│  ┌────────────────────┐  │  ┌──────────────────────────────┐    │
│  │   Zustand Store    │◄─┼──┤    REST API Controllers      │    │
│  │  (Global State)    │  │  │  notes / commits / branches  │    │
│  └────────┬───────────┘  │  │         / ai                 │    │
│           │              │  └──────────┬───────────────────┘    │
│  ┌────────▼───────────┐  │  ┌──────────▼───────────────────┐    │
│  │    UI Components   │  │  │    Custom Data Structures    │    │
│  │  Editor, Sidebar,  │  │  │  LinkedList, Stack, HashMap, │    │
│  │  Topbar, Modals    │  │  │  CommitArray, BranchGraph    │    │
│  └────────┬───────────┘  │  └──────────┬───────────────────┘    │
│           │              │  ┌──────────▼───────────────────┐    │
│  ┌────────▼───────────┐  │  │     StorageEngine (JSON)     │    │
│  │  DSA Visualizers   │  │  │      ~/.notegit/             │    │
│  │  (Animated SVG)    │  │  └──────────────────────────────┘    │
│  └────────────────────┘  │  ┌──────────────────────────────┐    │
│                          │  │    Gemini AI Integration     │    │
│                          │  │   (Commit, Diff, Chat, etc.) │    │
│                          │  └──────────────────────────────┘    │
└──────────────────────────┴──────────────────────────────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite + Tailwind CSS | UI, real-time visualizers, state management |
| **State** | Zustand | Global store with async API actions |
| **Backend** | Express.js (Node 18+) | REST API, data structure orchestration |
| **Storage** | JSON files on disk (`~/.notegit/`) | Zero-config, no database required |
| **AI** | Google Gemini 2.5 Flash | Commit messages, diff summaries, chat |
| **Real-time** | Socket.io + Chokidar | File watcher for live sync (local only) |

---

## ⭐ Ranked Functionalities

### Tier 1 — Core Features
| # | Feature | Description |
|---|---------|-------------|
| 1 | **Note CRUD** | Create, read, edit, and delete notes with instant persistence |
| 2 | **Git-Style Commits** | Snapshot note versions with commit hashes, messages, and timestamps |
| 3 | **Undo / Redo** | Full undo/redo history with debounced change tracking |
| 4 | **Branching** | Create named branches to explore alternate versions of a note |
| 5 | **Branch Merging** | Three-way merge with automatic conflict detection and resolution |
| 6 | **Version Restore** | Restore any note to a previous commit state |

### Tier 2 — DSA Visualizations (Live & Interactive)
| # | Feature | Data Structure | What It Shows |
|---|---------|---------------|---------------|
| 7 | **Commit History** | Singly Linked List | Chain of commit nodes with parent pointers |
| 8 | **Undo/Redo Stacks** | Dual Stack | Side-by-side undo and redo stack frames |
| 9 | **Note Registry** | Hash Map (djb2) | 8-bucket hash table with collision chaining |
| 10 | **Commit Index** | Array | Indexed commit cells with HEAD pointer |
| 11 | **Branch Graph** | Directed Acyclic Graph (DAG) | SVG branch forks, merges, and commit relationships |

### Tier 3 — AI-Powered Features (Gemini)
| # | Feature | Description |
|---|---------|-------------|
| 12 | **AI Commit Messages** | Auto-generates concise commit messages from your changes |
| 13 | **Diff Summaries** | AI-powered natural language summary of version differences |
| 14 | **Note Evolution Analysis** | Tracks how your notes have evolved over time |
| 15 | **Branch Recommendations** | Suggests when content diverges enough to warrant a new branch |
| 16 | **AI Chat Assistant** | Context-aware Q&A about your note content |

### Tier 4 — UI & Experience
| # | Feature | Description |
|---|---------|-------------|
| 17 | **Dark Terminal Theme** | Premium dark UI inspired by code editors and terminal aesthetics |
| 18 | **Line-Level Diff Modal** | Visual side-by-side diff viewer with added/removed/unchanged lines |
| 19 | **Real-Time File Watcher** | Socket.io-powered live sync when notes change on disk |
| 20 | **Keyboard Shortcuts** | `Ctrl+Z` / `Ctrl+Y` for undo/redo directly in the editor |

---

## 🔬 DSA Deep Dive — How Git Operations Map to Data Structures

### 1. Singly Linked List → Commit History

```
 HEAD
  │
  ▼
┌─────────┐     ┌─────────┐    ┌─────────┐
│ a1b2c3d │───▶│ e4f5g6h │───▶│ i7j8k9l │───▶ null
│ Fix bug │     │ Add fn  │    │  Init   │
└─────────┘     └─────────┘    └─────────┘
  commit 3       commit 2       commit 1
```

**Implementation:** [`backend/core/LinkedList.js`](backend/core/LinkedList.js)

Each commit is a **node** in a singly linked list. When you commit, a new `CommitNode` is prepended at the head in **O(1)** time. Each node stores:
- `hash` — 7-character hex identifier
- `message` — commit description
- `content` — full note text at this point in time
- `parent` — pointer to the previous commit's hash

**Key Operations:**
| Operation | Method | Time Complexity |
|-----------|--------|----------------|
| Create commit | `push()` | O(1) |
| Find commit by hash | `findByHash()` | O(n) |
| Restore to commit | `restoreTo()` | O(n) |
| Serialize to array | `toArray()` | O(n) |

**Visualizer:** The `LinkedListViz` component renders each node as a green pill with an arrow (`→`) pointing to its parent, with the HEAD commit highlighted.

---

### 2. Stack → Undo / Redo

```
   Undo Stack          Redo Stack
  ┌──────────┐        ┌──────────┐
  │ "Hello W"│  TOP   │ "Hello"  │  TOP
  ├──────────┤        ├──────────┤
  │ "Hello " │        │  (empty) │
  ├──────────┤        └──────────┘
  │ "Hell"   │
  ├──────────┤
  │ "Hel"    │
  └──────────┘
```

**Implementation:** [`backend/core/Stack.js`](backend/core/Stack.js)

NoteGit uses two stacks — an **Undo Stack** and a **Redo Stack** — managed by the `UndoRedoManager` class:
- **Every edit** pushes a content snapshot onto the Undo Stack and clears the Redo Stack
- **Undo (Ctrl+Z)** pops the current state to the Redo Stack and peeks at the new top of the Undo Stack
- **Redo (Ctrl+Y)** pops from the Redo Stack and pushes it back onto the Undo Stack
- Maximum depth is 50 entries — oldest entries are evicted from the bottom

**Key Operations:**
| Operation | Method | Time Complexity |
|-----------|--------|----------------|
| Record change | `recordChange()` | O(1) |
| Undo | `undo()` | O(1) |
| Redo | `redo()` | O(1) |
| Get top N frames | `topFrames(n)` | O(n) |

**Visualizer:** The `StackViz` component renders two vertical card columns side by side, with the most recent entry at the top. Active items pulse with a green glow.

---

### 3. Hash Map → Note Registry

```
  Bucket 0: [ ]
  Bucket 1: [ "System Design" ]
  Bucket 2: [ ]
  Bucket 3: [ "DSA Notes", "Graph Theory" ]  ← collision chain
  Bucket 4: [ ]
  Bucket 5: [ "React Hooks" ]
  Bucket 6: [ ]
  Bucket 7: [ "Git Internals" ]
```

**Implementation:** [`backend/core/HashMap.js`](backend/core/HashMap.js)

The note registry uses a custom **hash map with the djb2 hash function** and chaining for collision resolution:
```
hash = 5381
for each character c in key:
    hash = ((hash << 5) + hash) + charCode(c)
return hash % capacity
```

Notes are stored in an array of 8 buckets. When you create a note, its title is hashed to determine which bucket it belongs to. If two note titles hash to the same bucket (collision), they form a chain in that bucket. The map automatically **resizes** (doubles capacity) when the load factor exceeds 0.75.

**Key Operations:**
| Operation | Method | Time Complexity |
|-----------|--------|----------------|
| Insert note | `set()` | O(1) average |
| Find note | `get()` | O(1) average |
| Delete note | `delete()` | O(1) average |
| Resize | `_resize()` | O(n) amortized |

**Visualizer:** The `HashMapViz` component renders an 8-cell grid. Filled buckets glow green, and clicking a note in the sidebar triggers a pulse animation on the corresponding bucket.

---

### 4. Array → Commit Index

```
  Index:  [0]        [1]        [2]        [3]
        ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
        │ a1b2c3 │ │ e4f5g6 │ │ i7j8k9 │ │ m0n1o2 │
        │  HEAD  │ │        │ │        │ │        │
        └────────┘ └────────┘ └────────┘ └────────┘
```

**Implementation:** [`backend/core/CommitArray.js`](backend/core/CommitArray.js)

The `CommitArray` provides an **indexed, ordered view** of the commit history. While the linked list represents the logical parent-child chain, the array gives O(1) index-based access to commits. New commits are prepended at index 0, so `array[0]` is always the HEAD.

**Key Operations:**
| Operation | Method | Time Complexity |
|-----------|--------|----------------|
| Add new commit | `prepend()` | O(n) — shifts elements |
| Access by index | `getAtIndex()` | O(1) |

**Visualizer:** The `ArrayViz` component renders horizontal indexed cells. The HEAD cell (index 0) is highlighted with a green border and a `▲ HEAD` marker.

---

### 5. Directed Acyclic Graph (DAG) → Branch Graph

```
        main                    feature
         │                        │
         ▼                        ▼
      ┌──────┐               ┌──────┐
      │ m3   │               │ f2   │
      └──┬───┘               └──┬───┘
         │                      │
      ┌──▼───┐               ┌──▼───┐
      │ m2   │               │ f1   │
      └──┬───┘               └──┬───┘
         │                      │
         └──────────┬───────────┘
                 ┌──▼───┐
                 │ m1   │  ← common ancestor
                 └──────┘
```

**Implementation:** [`backend/core/BranchGraph.js`](backend/core/BranchGraph.js)

The `BranchGraph` is a **Directed Acyclic Graph** where:
- Each **node** is a commit with a list of parent hashes
- Each **edge** points from a parent to a child
- **Branch pointers** are labels that reference the latest commit hash on that branch
- **Merge commits** have two parents (from both branches)

The graph uses **BFS (Breadth-First Search)** to find the **Lowest Common Ancestor (LCA)** of two branches for three-way merging:

```javascript
_findCommonAncestor(hashA, hashB) {
  // BFS from hashA — collect all ancestors
  // BFS from hashB — first ancestor found in A's set is the LCA
}
```

**Key Operations:**
| Operation | Method | Time Complexity |
|-----------|--------|----------------|
| Add commit | `addCommit()` | O(k) where k = parent count |
| Create branch | `createBranch()` | O(1) |
| Switch branch | `switchBranch()` | O(1) |
| Find common ancestor | `_findCommonAncestor()` | O(V + E) — BFS |

**Visualizer:** The `GraphViz` component renders an SVG canvas with:
- Commit nodes positioned in a horizontal timeline
- Branch labels with colored badges
- SVG path lines connecting parent → child
- Merge nodes shown as rings with lines converging from both parents

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey) (for AI features)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Sudhanshu611/notegit.git
cd notegit

# 2. Install all dependencies (frontend + backend)
npm install

# 3. Configure your Gemini API key
#    Create/edit backend/.env and add:
echo GEMINI_API_KEY=your_api_key_here > backend/.env

# 4. Start the development server
npm run dev
```

The app will start on:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

### Build for Production

```bash
npm run build
```

This compiles the React frontend into `frontend/dist/`.

---

## 📖 User Manual

### Creating Your First Note

1. Click the **`+ New Note`** button in the sidebar.
2. Enter a title (e.g., *"DSA Notes"*) in the prompt dialog.
3. The note opens in the editor. Start typing!
4. Watch the **Hash Map** visualizer light up — your note title has been hashed into a bucket.

### Editing & Undo/Redo

1. Type in the editor. Changes are **debounced** (saved after 500ms of inactivity).
2. Press **`Ctrl+Z`** to undo — watch the **Undo Stack** pop and the **Redo Stack** push.
3. Press **`Ctrl+Y`** to redo — the stacks reverse.
4. The top 5 frames of each stack are visible in the **Stack Visualizer**.

### Committing Changes

1. Click the **`Commit`** button in the bottom toolbar (or the commit bar).
2. NoteGit automatically generates an **AI commit message** using Gemini (or you can type your own).
3. A new node appears in:
   - The **Linked List** visualizer (at the HEAD)
   - The **Array** visualizer (at index 0)
   - The **Branch Graph** (on the active branch)

### Viewing Diffs

1. In the **Commit Timeline** (right panel), click any commit hash.
2. A **Diff Modal** opens showing:
   - **Line-by-line diff** with `+` (added), `-` (removed), and unchanged lines
   - An **AI Summary** of what changed between the two versions

### Branching

1. Open the **Branch Manager** by clicking the branch indicator in the top bar.
2. Click **`+ New Branch`** and enter a name (e.g., *"feature-refactor"*).
3. The branch forks from your current commit — visible in the **Branch Graph**.
4. Switch between branches to work on different versions of the same note.

### Merging Branches

1. In the **Branch Manager**, click **`Merge Branch`**.
2. Select the source branch to merge into the current branch.
3. If there are **no conflicts**, the merge completes automatically with a merge commit (shown as a ring node in the graph).
4. If there are **conflicts**:
   - The editor displays conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
   - Edit the text to resolve conflicts manually.
   - Commit the resolved content — this creates a merge-resolution commit linking both parents.

### Using the AI Assistant

1. Click the **AI icon** (🤖) in the top bar to open the AI panel.
2. Ask questions about your note content:
   - *"Summarize this note"*
   - *"What are the key concepts?"*
   - *"Explain the conflict markers"*
3. The AI responds using the current note content as context.

### Restoring a Previous Version

1. In the **Commit Timeline**, find the commit you want to restore.
2. Click the **restore icon** next to the commit.
3. The editor content is replaced with the snapshot from that commit.
4. The Undo/Redo stacks reset to reflect the restored content.

---

## 📁 Project Structure

```
notegit/
├── api/
│   └── index.js              # Vercel serverless entry point
├── backend/
│   ├── ai/
│   │   └── gemini.js          # Gemini AI integration (5 functions)
│   ├── controllers/
│   │   ├── notes.controller.js
│   │   ├── commits.controller.js
│   │   ├── branches.controller.js
│   │   └── ai.controller.js
│   ├── core/                  # Custom DSA implementations
│   │   ├── LinkedList.js      # Singly Linked List
│   │   ├── Stack.js           # Stack + UndoRedoManager
│   │   ├── HashMap.js         # Hash Map with djb2
│   │   ├── CommitArray.js     # Indexed commit array
│   │   └── BranchGraph.js     # DAG for branch visualization
│   ├── routes/
│   │   ├── notes.routes.js
│   │   ├── commits.routes.js
│   │   ├── branches.routes.js
│   │   └── ai.routes.js
│   ├── storage/
│   │   ├── StorageEngine.js   # JSON file persistence
│   │   └── watcher.js         # Chokidar file watcher
│   ├── server.js              # Express app entry
│   └── .env                   # GEMINI_API_KEY (not committed)
├── frontend/
│   ├── src/
│   │   ├── api/client.js      # Axios HTTP client
│   │   ├── store/notegitStore.js  # Zustand global state
│   │   ├── components/
│   │   │   ├── ai/            # AI chat panel
│   │   │   ├── dsa/           # DSA visualizer components
│   │   │   │   ├── DSAPanel.jsx
│   │   │   │   ├── LinkedListViz.jsx
│   │   │   │   ├── StackViz.jsx
│   │   │   │   ├── HashMapViz.jsx
│   │   │   │   ├── ArrayViz.jsx
│   │   │   │   └── GraphViz.jsx
│   │   │   ├── editor/        # Note editor + commit UI
│   │   │   ├── layout/        # AppShell, Sidebar, Topbar
│   │   │   └── modals/        # DiffModal, BranchManager
│   │   └── styles/            # Tailwind config + custom CSS
│   └── package.json
├── package.json               # Monorepo root (workspaces)
├── vercel.json                # Vercel deployment config
└── README.md
```

---

## 🌐 API Reference

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notes` | List all notes |
| `POST` | `/api/notes` | Create a new note |
| `GET` | `/api/notes/:id` | Get note metadata |
| `DELETE` | `/api/notes/:id` | Delete a note |
| `POST` | `/api/notes/:id/change` | Record an editor change (undo stack) |
| `POST` | `/api/notes/:id/undo` | Perform undo |
| `POST` | `/api/notes/:id/redo` | Perform redo |

### Commits
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/commits/:noteId` | Get all commits + DSA states |
| `POST` | `/api/commits/:noteId` | Create a new commit |
| `GET` | `/api/commits/:noteId/commit/:hash` | Get a specific commit |
| `POST` | `/api/commits/:noteId/restore/:hash` | Restore to a commit |

### Branches
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/branches/:noteId` | List branches |
| `POST` | `/api/branches/:noteId` | Create a branch |
| `POST` | `/api/branches/:noteId/switch` | Switch branch |
| `POST` | `/api/branches/:noteId/merge` | Merge branches |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/commit-message` | Generate AI commit message |
| `POST` | `/api/ai/summarize-diff` | Summarize a diff |
| `POST` | `/api/ai/evolution` | Analyze note evolution |
| `POST` | `/api/ai/branch-suggest` | Get branch suggestions |
| `POST` | `/api/ai/chat` | Chat with AI about note content |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2 | UI framework |
| Vite | 4.4 | Build tool & dev server |
| Tailwind CSS | 3.3 | Utility-first styling |
| Zustand | 4.4 | Lightweight state management |
| Express | 4.18 | REST API server |
| Socket.io | 4.6 | Real-time file change events |
| Chokidar | 3.5 | Filesystem watcher |
| Axios | 1.4 | HTTP client |
| Google Generative AI | 0.24 | Gemini API SDK |
| fs-extra | 11.1 | Enhanced filesystem operations |

---

## 📄 License

This project is built for educational and personal use. It demonstrates how Git's internal data structures work through interactive visualizations.

---

<p align="center">
  Built with 💚 by <a href="https://github.com/Sudhanshu611">Sudhanshu</a>
</p>
