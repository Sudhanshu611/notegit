# NoteGit — User & Testing Guide

Welcome to **NoteGit**! This guide outlines how to use, explore, and test NoteGit's core version-control mechanics, custom Data Structure & Algorithm (DSA) telemetry, and Gemini AI features.

---

## Quick Start (Running the App)

NoteGit runs as a coordinated local stack:
1. Open a terminal in the root workspace folder (`d:\note_git`).
2. Run the concurrent development command:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**.
4. Verify the status bar displays <span style="color:#3DDC84">**WATCHER ONLINE**</span>.

---

## Guided Tour & Testing Walkthrough

Follow these steps to experience and verify the application's unique features.

### 1. Note Indexing & Djb2 Hashing (HashMap)
* **Action:** Click the **`+ New Note`** button in the left sidebar and name it `System Design Notes`.
* **Telemetry Update:** 
  - Look at the **Hash Map - Note Index** visualizer in the right panel.
  - You will see a telemetry logs block mapping:
    `djb2_hash("System Design Notes") % 8 → slot N`
  - The mapped bucket cell will **pulse purple** for 600ms, indicating the note has been indexed and stored in that bucket.
* **Collision Check:** Create another note named `Interview Prep`. If it hashes to the same slot, the HashMap visualizer will display a collision tag showing the list chaining (`Note A → Note B`).

### 2. Typing & Operations Tracking (Stack)
* **Action:** Select `System Design Notes` and click into the center editor. Type:
  ```markdown
  # Load Balancing Strategies
  Load balancing distributes incoming traffic across servers.
  ```
* **Telemetry Update:**
  - Watch the **Stack - Undo / Redo** visualizer cards.
  - As you type, your changes are debounced (500ms) and pushed to the **Undo Stack** as string snapshots.
* **Hotkeys:**
  - Press `Ctrl + Z` to undo: the top snapshot pops off the Undo Stack, pushes onto the **Redo Stack**, and the editor content reverts.
  - Press `Ctrl + Shift + Z` (or `Ctrl + Y`) to redo: the state shifts back to the Undo Stack.

### 3. Checkpointing Version History (LinkedList & Array)
* **Action:** Move to the bottom **Commit Bar**. Type a message like `Add load balancing description` and click **`Commit ✓`**.
* **Telemetry Update:**
  - **Linked List:** A new node representing the commit hash (e.g., `e3da770`) prepends to the chain, pointing to the parent.
  - **Commit Array:** The horizontal cells shift right, and your new commit occupies index `[0]` underneath the green `HEAD` arrow.
  - **Undo Stack:** The stack resets since a new baseline is established.
  - **Timeline:** The commit is listed in the bottom history timeline drawer.

### 4. Branching topographies (Branch Graph)
* **Action:** Click the branch selectors pill in the topbar or click `Branches` in the bottom bar to open the **Branch Manager**.
* **Action:** Click **`+ New Branch`**, enter `feature/round-robin`, and click **Create**.
* **Action:** Checkout/Switch to `feature/round-robin` by clicking on its row in the list.
* **Action:** Write some changes in the editor (e.g., add `* Round Robin: sequential distribution`) and click **Commit ✓**.
* **Telemetry Update:**
  - Look at the **Branch Graph - Branches** SVG panel.
  - You will see a new branch path fanning out of the `main` node line, with an active green ring highlighting the head of `feature/round-robin`.

### 5. Merging & Conflict Resolution
* **Action:** Switch back to the `main` branch (using the topbar pill or Branch Manager list).
* **Action:** Edit the same line in `main` to something conflicting (e.g., add `* Round Robin: distributes requests round by round`) and click **Commit ✓**.
* **Action:** Open the **Branch Manager** and click **`Merge Branch`**. Select `feature/round-robin`.
* **Conflict Warning:** NoteGit will alert you that a merge conflict has occurred!
* **Resolution:**
  - Look at the editor. You will see Git-style conflict markers:
    ```markdown
    <<<<<<< main
    * Round Robin: distributes requests round by round
    =======
    * Round Robin: sequential distribution
    >>>>>>> feature/round-robin
    ```
  - Edit the text to resolve the conflict (delete the markers and combine the lines).
  - Type a merge resolution commit message in the Commit Bar and click **`Commit ✓`**.
  - The Branch Graph will draw a merge node linking both branch path lines together.

### 6. Code Comparisons & AI Summaries (Diff Modal)
* **Action:** Open the bottom history timeline. Click on your latest commit row.
* **Modal View:** 
  - The **Diff View** modal opens, displaying line insertions in green (+ prefix) and deletions in red (- prefix).
  - Look at the **Gemini AI Summary** card inside the modal. The Gemini API analyzes the lines and writes a clear summary explaining the changes (e.g., *"Merged round-robin description from branch, adjusting description syntax."*).
* **Restore:** Click **`Restore Version`** to instantly restore the editor content to that version.

### 7. Conversational Assistant (AI Panel)
* **Action:** Click **`✦ AI Assistant`** in the topbar to slide out the AI drawer.
* **Suggestion Telemetry:** The AI automatically scans your editor content and commit timeline to generate stats (evolution charts) and suggests branch divisions (e.g., recommending fanning out file modifications into `feat/algorithms`). Click **`Checkout Branch`** to apply.
* **Context Chat:** Type a question in the chat input (e.g., *"What load balancing algorithms did I record?"*) and click send. Gemini will reply by analyzing your active note text.
