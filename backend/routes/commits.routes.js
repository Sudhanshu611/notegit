// backend/routes/commits.routes.js
import express from 'express'
import {
  createCommit,
  getCommits,
  restoreCommit,
  diffCommits,
  getSingleCommit
} from '../controllers/commits.controller.js'

const router = express.Router()

router.get('/:id', getCommits)
router.post('/:id', createCommit)
router.post('/:id/restore/:hash', restoreCommit)
router.get('/:id/diff', diffCommits)
router.get('/:id/commit/:hash', getSingleCommit)

export default router
