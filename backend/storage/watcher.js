// backend/storage/watcher.js
import chokidar from 'chokidar'
import path     from 'path'
import os       from 'os'

const ROOT = path.join(os.homedir(), '.notegit')

export function startWatcher(io) {
  chokidar.watch(ROOT, { ignoreInitial: true }).on('all', (event, filePath) => {
    // We only care about modifications or additions inside a note's folder
    const normalizedPath = path.normalize(filePath)
    const parts = normalizedPath.split(path.sep)
    const notesIndex = parts.indexOf('notes')
    
    if (notesIndex !== -1 && parts.length > notesIndex + 1) {
      const noteId = parts[notesIndex + 1]
      // Exclude events on the commits subdirectory itself or index.json
      if (noteId && noteId !== 'index.json') {
        io.emit('note:changed', { noteId, event })
      }
    } else if (parts.includes('index.json')) {
      io.emit('index:changed')
    }
  })
}
