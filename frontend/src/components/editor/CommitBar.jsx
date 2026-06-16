// frontend/src/components/editor/CommitBar.jsx
import React, { useState } from 'react'
import { useNoteGitStore } from '../../store/notegitStore'
import client from '../../api/client'

export default function CommitBar() {
  const activeNoteId = useNoteGitStore(s => s.activeNoteId)
  const hasUnsavedChanges = useNoteGitStore(s => s.hasUnsavedChanges)
  const createCommit = useNoteGitStore(s => s.createCommit)
  const noteContent = useNoteGitStore(s => s.noteContent)
  const commits = useNoteGitStore(s => s.commits)
  
  const [message, setMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  if (!activeNoteId) return null

  const handleCommit = async () => {
    const commitMsg = message.trim() || `Commit at ${new Date().toLocaleTimeString()}`
    await createCommit(commitMsg)
    setMessage('')
  }

  const handleAIGenerate = async () => {
    setIsGenerating(true)
    try {
      // Find current HEAD content to compare
      // If we don't have commits, the baseline content is empty string ''
      let beforeContent = ''
      if (commits && commits.length > 0) {
        // Fetch commit details for head hash
        const headHash = commits[0].hash
        const headRes = await client.get(`/commits/${activeNoteId}/restore/${headHash}`)
        beforeContent = headRes.data.content
      }

      const res = await client.post('/ai/commit-message', {
        before: beforeContent,
        after: noteContent
      })
      if (res.data.message) {
        setMessage(res.data.message)
      }
    } catch (err) {
      console.error('Failed to generate AI commit message:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-bg-surface border-t border-border-low px-6 py-3 shrink-0 flex flex-col gap-1.5 font-ui-label">
      <div className="flex items-center gap-3 w-full">
        {/* Unsaved indicator dot */}
        <div 
          className={`w-2.5 h-2.5 rounded-full ${hasUnsavedChanges ? 'bg-accent-amber animate-pulse' : 'bg-accent-green'}`} 
          title={hasUnsavedChanges ? 'Uncommitted changes' : 'All changes committed'} 
        />
        
        {/* Commit message input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCommit() }}
            placeholder="Commit message: describe what changed..."
            className="w-full bg-background border border-border-low rounded-md px-3 py-1.5 text-[12px] font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-all"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleCommit}
          className="bg-accent-green hover:brightness-110 text-on-primary font-mono text-[11px] font-bold uppercase tracking-wide px-5 py-2 rounded-sm transition-all duration-150 active:scale-95 cursor-pointer"
        >
          Commit ✓
        </button>
      </div>

      {/* AI Message Generation Trigger Link */}
      {hasUnsavedChanges && (
        <div className="ml-5 flex items-center gap-1.5 text-[11px] animate-in fade-in duration-200">
          <button
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="text-accent-amber hover:underline flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
            {isGenerating ? 'Generating message with Gemini...' : 'Generate commit message with AI'}
          </button>
        </div>
      )}
    </div>
  )
}
