// backend/routes/branches.routes.js
import express from 'express'
import {
  getBranches,
  createBranch,
  switchBranch,
  mergeBranches
} from '../controllers/branches.controller.js'

const router = express.Router()

router.get('/:noteId', getBranches)
router.post('/:noteId', createBranch)
router.post('/:noteId/switch', switchBranch)
router.post('/:noteId/merge', mergeBranches)

export default router
