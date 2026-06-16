// backend/controllers/ai.controller.js
import { GeminiAI } from '../ai/gemini.js'
import { StorageEngine } from '../storage/StorageEngine.js'

export async function generateCommitMessage(req, res) {
  try {
    const { before, after } = req.body
    const message = await GeminiAI.generateCommitMessage(before || '', after || '')
    res.json({ message })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function summarizeDiff(req, res) {
  try {
    const { diff } = req.body
    if (!diff || !Array.isArray(diff)) {
      return res.status(400).json({ error: 'Diff array is required' })
    }
    const summary = await GeminiAI.summarizeDiff(diff)
    res.json({ summary })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function analyzeEvolution(req, res) {
  try {
    const { noteId } = req.body
    if (!noteId) return res.status(400).json({ error: 'NoteId is required' })

    const commits = await StorageEngine.getAllCommits(noteId)
    const analysis = await GeminiAI.analyzeEvolution(commits)
    res.json({ analysis })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function suggestBranch(req, res) {
  try {
    const { noteId, content } = req.body
    if (!noteId) return res.status(400).json({ error: 'NoteId is required' })

    const commits = await StorageEngine.getAllCommits(noteId)
    const suggestion = await GeminiAI.suggestBranch(content || '', commits)
    
    res.json({ suggestion })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function chat(req, res) {
  try {
    const { question, content } = req.body
    if (!question) return res.status(400).json({ error: 'Question is required' })

    const reply = await GeminiAI.chat(question, content || '')
    res.json({ reply })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
