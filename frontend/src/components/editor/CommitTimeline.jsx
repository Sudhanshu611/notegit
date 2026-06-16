// frontend/src/components/editor/CommitTimeline.jsx
import React, { useState } from 'react'
import { useNoteGitStore } from '../../store/notegitStore'
import client from '../../api/client'

export default function CommitTimeline() {
  const activeNoteId = useNoteGitStore(s => s.activeNoteId)
  const commits = useNoteGitStore(s => s.commits)
  const restoreCommit = useNoteGitStore(s => s.restoreCommit)
  const openDiffModal = useNoteGitStore(s => s.openDiffModal)
  
  const [collapsed, setCollapsed] = useState(false)

  if (!activeNoteId) return null

  const handleRestore = async (e, hash) => {
    e.stopPropagation()
    if (confirm(`Restore note content to commit version ${hash}?`)) {
      await restoreCommit(hash)
    }
  }

  const handleCommitClick = async (commit, index) => {
    // Determine the 'from' hash for diffing (parent hash, or previous commit in timeline)
    // In our commits list, index 0 is HEAD, index 1 is older, etc.
    // So to see what changed in commit index X, we compare from index X+1 (older) to index X (clicked commit)
    const toHash = commit.hash
    let fromHash = commit.parent
    
    // If parent hash is null but there is a next commit in our array, use that as base
    if (!fromHash && index < commits.length - 1) {
      fromHash = commits[index + 1].hash
    }

    // If there is no older version, compare against empty state (or ignore if it's the root initial commit)
    try {
      let diffRes
      if (fromHash) {
        diffRes = await client.get(`/commits/${activeNoteId}/diff?fromHash=${fromHash}&toHash=${toHash}`)
      } else {
        // Compare against an empty string / mock root diff
        diffRes = await client.get(`/commits/${activeNoteId}/diff?fromHash=${toHash}&toHash=${toHash}`)
        // Adjust diff to show everything added
        diffRes.data.diff = diffRes.data.diff.map(line => ({ ...line, type: 'added' }))
      }

      const diff = diffRes.data.diff

      // Generate AI summary for this diff
      let aiSummary = 'No changes detected.'
      if (diff && diff.length > 0) {
        const aiRes = await client.post('/ai/diff-summary', { diff })
        aiSummary = aiRes.data.summary
      }

      openDiffModal({
        from: fromHash || 'ROOT',
        to: toHash,
        diff,
        aiSummary,
        commitMessage: commit.message
      })
    } catch (err) {
      console.error('Failed to load diff comparison:', err)
    }
  }

  return (
    <div className="bg-bg-surface border-t border-border-low select-none font-ui-label">
      {/* Header */}
      <div 
        onClick={() => setCollapsed(!collapsed)}
        className="px-6 py-2.5 flex items-center justify-between border-b border-border-low cursor-pointer hover:bg-bg-hover/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-caption-caps text-caption-caps text-text-muted tracking-wider uppercase">COMMIT HISTORY</span>
          <span className="text-[10px] bg-bg-card border border-border-low px-1.5 py-0.2 rounded text-text-secondary font-mono">
            {commits.length}
          </span>
        </div>
        <button className="material-symbols-outlined text-text-secondary text-[16px]">
          {collapsed ? 'unfold_more' : 'unfold_less'}
        </button>
      </div>

      {/* Timeline Rows */}
      {!collapsed && (
        <div className="max-h-40 overflow-y-auto custom-scrollbar">
          {commits.length === 0 ? (
            <div className="px-6 py-4 text-text-muted italic text-[11px]">
              No commit history. Make your first commit to seed version history.
            </div>
          ) : (
            <div className="divide-y divide-border-low/40">
              {commits.map((c, idx) => (
                <div
                  key={c.hash}
                  onClick={() => handleCommitClick(c, idx)}
                  className="group flex items-center justify-between px-6 py-2 hover:bg-bg-hover/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                    {/* Timeline dot */}
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-green shrink-0" />
                    
                    {/* Commit Hash */}
                    <code className="text-[11px] font-mono text-text-muted bg-bg-card px-1.5 py-0.5 border border-border-low/60 shrink-0">
                      {c.hash}
                    </code>

                    {/* Commit Message */}
                    <span className="text-[12px] text-text-primary font-mono truncate">
                      {c.message}
                    </span>
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex items-center gap-4 shrink-0 font-ui-label text-[11px] text-text-muted">
                    <span>
                      {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    {/* Restore Hover Trigger */}
                    <button
                      onClick={(e) => handleRestore(e, c.hash)}
                      className="bg-bg-card hover:bg-bg-hover text-accent-amber border border-border-low px-2 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-semibold cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[12px]">history</span>
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
