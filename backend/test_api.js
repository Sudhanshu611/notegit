// backend/test_api.js
import { StorageEngine } from './storage/StorageEngine.js'
import { getNoteState } from './controllers/commits.controller.js'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'

const ROOT = path.join(os.homedir(), '.notegit')

async function run() {
  await StorageEngine.init()
  const noteId = 'bb34d257-16f6-4b20-a1d4-eada200c86b2'
  console.log('Testing specific note:', noteId)
  
  const noteMeta = await StorageEngine.getNote(noteId)
  console.log('Note Meta from disk:', noteMeta)
  
  const commitDir = path.join(ROOT, 'notes', noteId, 'commits')
  if (await fs.pathExists(commitDir)) {
    const files = await fs.readdir(commitDir)
    console.log('Commit JSON files on disk:', files)
  } else {
    console.log('Commit directory does NOT exist!')
  }
  
  const commits = await StorageEngine.getAllCommits(noteId)
  console.log('StorageEngine.getAllCommits count:', commits.length)
  
  try {
    const state = await getNoteState(noteId)
    console.log('Re-hydrated LinkedList head:', state.list.head ? state.list.head.hash : 'null')
  } catch (err) {
    console.error('Re-hydration error:', err)
  }
}

run().catch(console.error)
