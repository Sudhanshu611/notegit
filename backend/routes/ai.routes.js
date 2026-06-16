// backend/routes/ai.routes.js
import express from 'express'
import {
  generateCommitMessage,
  summarizeDiff,
  analyzeEvolution,
  suggestBranch,
  chat
} from '../controllers/ai.controller.js'

const router = express.Router()

router.post('/commit-message', generateCommitMessage)
router.post('/diff-summary', summarizeDiff)
router.post('/evolution', analyzeEvolution)
router.post('/suggest-branch', suggestBranch)
router.post('/chat', chat)

export default router
