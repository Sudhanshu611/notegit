// backend/controllers/notes.controller.js
import crypto from 'crypto'
import { StorageEngine } from '../storage/StorageEngine.js'
import { UndoRedoManager } from '../core/Stack.js'

// In-memory Undo/Redo managers map
const undoRedoManagers = new Map()

export function getUndoRedoManager(noteId) {
  if (!undoRedoManagers.has(noteId)) {
    undoRedoManagers.set(noteId, new UndoRedoManager())
  }
  return undoRedoManagers.get(noteId)
}

export async function getAllNotes(req, res) {
  try {
    const notesMap = await StorageEngine.getAllNotes()
    res.json(Object.values(notesMap))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function createNote(req, res) {
  try {
    const { title } = req.body
    if (!title) return res.status(400).json({ error: 'Title is required' })

    const noteId = crypto.randomUUID()
    await StorageEngine.createNote(noteId, title)
    
    // Seed an initial empty commit to main branch
    const commitHash = crypto.createHash('sha1').update('Initial' + Date.now()).digest('hex').slice(0, 7)
    const commit = {
      hash: commitHash,
      message: 'Initial commit',
      content: '',
      parent: null,
      timestamp: Date.now()
    }
    await StorageEngine.saveCommit(noteId, commit)

    const meta = await StorageEngine.getNote(noteId)
    res.json(meta)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getNote(req, res) {
  try {
    const { id } = req.params
    const note = await StorageEngine.getNote(id)
    if (!note) return res.status(404).json({ error: 'Note not found' })
    res.json(note)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function deleteNote(req, res) {
  try {
    const { id } = req.params
    await StorageEngine.deleteNote(id)
    undoRedoManagers.delete(id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Record content changes into the undo stack (debounced typing)
export async function recordChange(req, res) {
  try {
    const { id } = req.params
    const { content } = req.body
    const manager = getUndoRedoManager(id)
    
    manager.recordChange(content)
    
    res.json({
      success: true,
      dsa: manager.getVisualizerState()
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function undo(req, res) {
  try {
    const { id } = req.params
    const { currentContent } = req.body
    const manager = getUndoRedoManager(id)
    
    const previousContent = manager.undo(currentContent)
    
    res.json({
      content: previousContent,
      dsa: manager.getVisualizerState()
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function redo(req, res) {
  try {
    const { id } = req.params
    const { currentContent } = req.body
    const manager = getUndoRedoManager(id)
    
    const nextContent = manager.redo(currentContent)
    
    res.json({
      content: nextContent,
      dsa: manager.getVisualizerState()
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
