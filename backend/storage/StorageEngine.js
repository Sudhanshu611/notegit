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
      id: noteId,
      title,
      createdAt: Date.now(),
      branches: { main: null },
      currentBranch: 'main'
    })
    await this._updateIndex(noteId, title)
    return noteId
  },

  async getNote(noteId) {
    const metaPath = path.join(ROOT, 'notes', noteId, 'meta.json')
    if (!await fs.pathExists(metaPath)) return null
    const meta = await fs.readJSON(metaPath)
    return meta
  },

  async saveNoteMeta(noteId, meta) {
    const metaPath = path.join(ROOT, 'notes', noteId, 'meta.json')
    await fs.writeJSON(metaPath, meta)
  },

  async getAllNotes() {
    const indexPath = path.join(ROOT, 'index.json')
    const index = await fs.readJSON(indexPath)
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
    if (meta) {
      const branch = meta.currentBranch ?? 'main'
      meta.branches = meta.branches ?? {}
      meta.branches[branch] = commit.hash
      await fs.writeJSON(path.join(ROOT, 'notes', noteId, 'meta.json'), meta)
    }
  },

  async getCommit(noteId, hash) {
    const commitPath = path.join(ROOT, 'notes', noteId, 'commits', `${hash}.json`)
    if (!await fs.pathExists(commitPath)) return null
    return fs.readJSON(commitPath)
  },

  async getAllCommits(noteId) {
    const dir = path.join(ROOT, 'notes', noteId, 'commits')
    if (!await fs.pathExists(dir)) return []
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
