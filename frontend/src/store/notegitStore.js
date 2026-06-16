// frontend/src/store/notegitStore.js
import { create } from 'zustand'
import client from '../api/client'

let debounceTimer = null
const clearPendingDebounce = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

export const useNoteGitStore = create((set, get) => ({
  // --- Note state ---
  notes: {},              // { [noteId]: noteMeta }
  activeNoteId: null,
  noteContent: '',
  noteTitle: '',
  hasUnsavedChanges: false,

  // --- Branch state ---
  activeBranch: 'main',
  branches: ['main'],

  // --- Commit state ---
  commits: [],            // ordered array, commits[0] = HEAD

  // --- DSA visualizer state ---
  dsaState: {
    linkedList: [],       // [ { hash, message, parent } ]
    undoStack: [],        // top 5 frames
    redoStack: [],
    hashMap: { buckets: [], capacity: 8, size: 0 },
    array: { commits: [], headIndex: 0 },
    graph: { nodes: [], edges: [], branches: {}, activeBranch: 'main' }
  },

  // --- UI state ---
  dsaPanelOpen: true,
  aiPanelOpen: false,
  diffModalOpen: false,
  diffData: null,         // { from, to, diff, aiSummary }

  // --- Actions ---
  setActiveNote: (id) => set({ activeNoteId: id }),
  setNoteContent: (c) => set({ noteContent: c, hasUnsavedChanges: true }),
  setDSAState: (ds) => set(s => ({ dsaState: { ...s.dsaState, ...ds } })),
  toggleDSAPanel: () => set(s => ({ dsaPanelOpen: !s.dsaPanelOpen })),
  toggleAIPanel: () => set(s => ({ aiPanelOpen: !s.aiPanelOpen })),
  openDiffModal: (d) => set({ diffModalOpen: true, diffData: d }),
  closeDiffModal: () => set({ diffModalOpen: false, diffData: null }),
  clearUnsaved: () => set({ hasUnsavedChanges: false }),

  // --- Async API actions ---
  fetchNotes: async () => {
    try {
      const res = await client.get('/notes')
      const notesList = res.data
      const notesMap = {}
      notesList.forEach(n => {
        notesMap[n.id] = n
      })
      set({ notes: notesMap })
      
      // Update hash map visualizer state with note list
      const hashMapState = get().dsaState.hashMap
      const buckets = new Array(hashMapState.capacity).fill(null).map(() => [])
      
      // Custom djb2 hash function replicated from backend for visual sync
      const djb2Hash = (key, capacity) => {
        let hash = 5381
        for (let i = 0; i < key.length; i++) {
          hash = ((hash << 5) + hash) + key.charCodeAt(i)
          hash = hash & hash
        }
        return Math.abs(hash) % capacity
      }

      notesList.forEach(n => {
        const slot = djb2Hash(n.title, hashMapState.capacity)
        buckets[slot].push(n.title)
      })

      set(s => ({
        dsaState: {
          ...s.dsaState,
          hashMap: {
            ...s.dsaState.hashMap,
            buckets: buckets.map((b, i) => ({ index: i, entries: b, filled: b.length > 0 })),
            size: notesList.length
          }
        }
      }))
    } catch (err) {
      console.error('Failed to fetch notes:', err)
    }
  },

  selectNote: async (noteId) => {
    clearPendingDebounce()
    try {
      if (!noteId) return
      
      // Reset editor and load meta
      const metaRes = await client.get(`/notes/${noteId}`)
      const meta = metaRes.data
      
      // Fetch commits and visualizer states
      const commitsRes = await client.get(`/commits/${noteId}`)
      const { commits, dsa } = commitsRes.data
      
      // Fetch branches
      const branchesRes = await client.get(`/branches/${noteId}`)
      const { branches, activeBranch } = branchesRes.data

      // Retrieve current HEAD content or conflict content if available
      let content = ''
      let hasUnsavedChanges = false
      if (meta.pendingMerge && meta.pendingMerge.targetBranch === activeBranch && meta.pendingMerge.conflictContent) {
        content = meta.pendingMerge.conflictContent
        hasUnsavedChanges = true
      } else if (commits && commits.length > 0) {
        // Fetch commit details for head hash
        const headHash = meta.branches[activeBranch]
        if (headHash) {
          const headRes = await client.get(`/commits/${noteId}/commit/${headHash}`)
          content = headRes.data.commit.content
        }
      }

      // Load Undo Stack for note
      const undoRes = await client.post(`/notes/${noteId}/change`, { content })
      const undoState = undoRes.data.dsa

      set(s => ({
        activeNoteId: noteId,
        noteTitle: meta.title,
        noteContent: content,
        hasUnsavedChanges: hasUnsavedChanges,
        activeBranch,
        branches,
        commits,
        dsaState: {
          ...s.dsaState,
          linkedList: dsa.linkedList,
          array: dsa.array,
          graph: dsa.graph,
          undoStack: undoState.undoStack,
          redoStack: undoState.redoStack
        }
      }))

      // Return a signal to trigger pulse animation in HashMapViz
      return meta.title
    } catch (err) {
      console.error('Failed to select note:', err)
    }
  },

  createNote: async (title) => {
    try {
      const res = await client.post('/notes', { title })
      await get().fetchNotes()
      return res.data.id
    } catch (err) {
      console.error('Failed to create note:', err)
    }
  },

  deleteNote: async (noteId) => {
    try {
      await client.delete(`/notes/${noteId}`)
      set({
        activeNoteId: null,
        noteTitle: '',
        noteContent: '',
        hasUnsavedChanges: false,
        commits: []
      })
      await get().fetchNotes()
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  },

  recordEditorChange: async (content) => {
    clearPendingDebounce()
    const noteId = get().activeNoteId
    if (!noteId) return
    set({ noteContent: content, hasUnsavedChanges: true })
    try {
      const res = await client.post(`/notes/${noteId}/change`, { content })
      set(s => ({
        dsaState: {
          ...s.dsaState,
          undoStack: res.data.dsa.undoStack,
          redoStack: res.data.dsa.redoStack
        }
      }))
    } catch (err) {
      console.error('Failed to record editor change:', err)
    }
  },

  recordEditorChangeDebounced: (content) => {
    const noteId = get().activeNoteId
    if (!noteId) return
    set({ noteContent: content, hasUnsavedChanges: true })
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(async () => {
      try {
        const res = await client.post(`/notes/${noteId}/change`, { content })
        set(s => ({
          dsaState: {
            ...s.dsaState,
            undoStack: res.data.dsa.undoStack,
            redoStack: res.data.dsa.redoStack
          }
        }))
      } catch (err) {
        console.error('Failed to record editor change:', err)
      }
    }, 500)
  },

  performUndo: async () => {
    clearPendingDebounce()
    const noteId = get().activeNoteId
    if (!noteId) return
    try {
      const currentContent = get().noteContent
      const res = await client.post(`/notes/${noteId}/undo`, { currentContent })
      set(s => ({
        noteContent: res.data.content,
        hasUnsavedChanges: true,
        dsaState: {
          ...s.dsaState,
          undoStack: res.data.dsa.undoStack,
          redoStack: res.data.dsa.redoStack
        }
      }))
    } catch (err) {
      console.error('Failed to perform undo:', err)
    }
  },

  performRedo: async () => {
    clearPendingDebounce()
    const noteId = get().activeNoteId
    if (!noteId) return
    try {
      const currentContent = get().noteContent
      const res = await client.post(`/notes/${noteId}/redo`, { currentContent })
      set(s => ({
        noteContent: res.data.content,
        hasUnsavedChanges: true,
        dsaState: {
          ...s.dsaState,
          undoStack: res.data.dsa.undoStack,
          redoStack: res.data.dsa.redoStack
        }
      }))
    } catch (err) {
      console.error('Failed to perform redo:', err)
    }
  },

  createCommit: async (message) => {
    const noteId = get().activeNoteId
    const content = get().noteContent
    if (!noteId) return
    try {
      const res = await client.post(`/commits/${noteId}`, { message, content })
      const { commit, dsa } = res.data
      set(s => ({
        hasUnsavedChanges: false,
        commits: [commit, ...s.commits],
        dsaState: {
          ...s.dsaState,
          linkedList: dsa.linkedList,
          array: dsa.array,
          graph: dsa.graph
        }
      }))
      // Re-fetch meta for branch changes mapping
      await get().fetchNotes()
    } catch (err) {
      console.error('Failed to create commit:', err)
    }
  },

  restoreCommit: async (hash) => {
    const noteId = get().activeNoteId
    if (!noteId) return
    try {
      const res = await client.post(`/commits/${noteId}/restore/${hash}`)
      const { content } = res.data
      set({ noteContent: content, hasUnsavedChanges: false })
      
      // Update backend stacks to reflect new content baseline
      await get().recordEditorChange(content)
      
      // Re-fetch commits to reload the linked list highlight
      const commitsRes = await client.get(`/commits/${noteId}`)
      set(s => ({
        commits: commitsRes.data.commits,
        dsaState: {
          ...s.dsaState,
          linkedList: commitsRes.data.dsa.linkedList,
          array: commitsRes.data.dsa.array,
          graph: commitsRes.data.dsa.graph
        }
      }))
    } catch (err) {
      console.error('Failed to restore commit:', err)
    }
  },

  createBranch: async (name) => {
    const noteId = get().activeNoteId
    if (!noteId) return
    try {
      const res = await client.post(`/branches/${noteId}`, { name })
      set(s => ({
        branches: res.data.branches,
        dsaState: {
          ...s.dsaState,
          graph: res.data.dsa.graph
        }
      }))
    } catch (err) {
      console.error('Failed to create branch:', err)
      throw err
    }
  },

  switchBranch: async (name) => {
    const noteId = get().activeNoteId
    if (!noteId) return
    try {
      const res = await client.post(`/branches/${noteId}/switch`, { name })
      const { content, headHash, dsa } = res.data

      const metaRes = await client.get(`/notes/${noteId}`)
      const meta = metaRes.data
      const isPendingMergeOnBranch = !!(meta.pendingMerge && meta.pendingMerge.targetBranch === name)

      set(s => ({
        activeBranch: name,
        noteContent: content,
        hasUnsavedChanges: isPendingMergeOnBranch,
        dsaState: {
          ...s.dsaState,
          graph: dsa.graph
        }
      }))

      // Reset UndoRedo stack for new branch content
      await get().recordEditorChange(content)

      // Re-fetch commits for this branch
      const commitsRes = await client.get(`/commits/${noteId}`)
      set(s => ({
        commits: commitsRes.data.commits,
        dsaState: {
          ...s.dsaState,
          linkedList: commitsRes.data.dsa.linkedList,
          array: commitsRes.data.dsa.array
        }
      }))
    } catch (err) {
      console.error('Failed to switch branch:', err)
    }
  },

  mergeBranch: async (source) => {
    const noteId = get().activeNoteId
    if (!noteId) return
    try {
      const res = await client.post(`/branches/${noteId}/merge`, { sourceBranch: source })
      if (res.data.conflicts) {
        // Merge conflict occurred, update editor text to conflict text
        set({
          noteContent: res.data.content,
          hasUnsavedChanges: true
        })
        return { conflicts: true, message: res.data.message }
      } else {
        const { content, dsa } = res.data
        set(s => ({
          noteContent: content,
          hasUnsavedChanges: false,
          dsaState: {
            ...s.dsaState,
            linkedList: dsa.linkedList,
            array: dsa.array,
            graph: dsa.graph
          }
        }))
        // Re-fetch commits list
        const commitsRes = await client.get(`/commits/${noteId}`)
        set({ commits: commitsRes.data.commits })
        return { conflicts: false }
      }
    } catch (err) {
      console.error('Failed to merge branch:', err)
      throw err
    }
  }
}))
