// backend/routes/notes.routes.js
import express from 'express'
import {
  getAllNotes,
  createNote,
  getNote,
  deleteNote,
  recordChange,
  undo,
  redo
} from '../controllers/notes.controller.js'

const router = express.Router()

router.get('/', getAllNotes)
router.post('/', createNote)
router.get('/:id', getNote)
router.delete('/:id', deleteNote)
router.post('/:id/change', recordChange)
router.post('/:id/undo', undo)
router.post('/:id/redo', redo)

export default router
