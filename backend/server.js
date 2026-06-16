// backend/server.js
import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import notesRouter from './routes/notes.routes.js'
import commitsRouter from './routes/commits.routes.js'
import branchesRouter from './routes/branches.routes.js'
import aiRouter from './routes/ai.routes.js'
import { StorageEngine } from './storage/StorageEngine.js'
import { startWatcher } from './storage/watcher.js'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'DELETE']
  }
})

const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Initialize local storage directory
await StorageEngine.init()

// API routing mount
app.use('/api/notes',    notesRouter)
app.use('/api/commits',  commitsRouter)
app.use('/api/branches', branchesRouter)
app.use('/api/ai',       aiRouter)

// Serve production build static files if present
const distPath = path.join(__dirname, '../frontend/dist')
app.use(express.static(distPath))

// Socket.io connection listener
io.on('connection', (socket) => {
  console.log('Client connected to NoteGit Socket:', socket.id)
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Start chokidar file watcher and stream updates to frontend
startWatcher(io)

// Catch-all route to serve Vite index.html in production
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('NoteGit API is running. Frontend dev server is required on port 5173.')
    }
  })
})

server.listen(PORT, () => {
  console.log(`NoteGit Express server is listening on port ${PORT}`)
})
