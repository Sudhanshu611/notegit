// frontend/src/components/modals/BranchManager.jsx
import React, { useState } from 'react'
import { useNoteGitStore } from '../../store/notegitStore'
import GraphViz from '../dsa/GraphViz'

export default function BranchManager({ isOpen, onClose }) {
  const activeNoteId = useNoteGitStore(s => s.activeNoteId)
  const branches = useNoteGitStore(s => s.branches)
  const activeBranch = useNoteGitStore(s => s.activeBranch)
  const createBranch = useNoteGitStore(s => s.createBranch)
  const switchBranch = useNoteGitStore(s => s.switchBranch)
  const mergeBranch = useNoteGitStore(s => s.mergeBranch)
  const commits = useNoteGitStore(s => s.commits)

  const [searchQuery, setSearchQuery] = useState('')
  const [mergeSelectOpen, setMergeSelectOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')

  if (!isOpen || !activeNoteId) return null

  const handleCreateBranch = async () => {
    const name = newBranchName.trim()
    if (!name) return
    try {
      await createBranch(name.toLowerCase())
      setNewBranchName('')
      setIsCreating(false)
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to create branch')
    }
  }

  const handleSwitch = async (bName) => {
    if (bName !== activeBranch) {
      await switchBranch(bName)
    }
  }

  const handleMerge = async (sourceBranch) => {
    setMergeSelectOpen(false)
    if (sourceBranch === activeBranch) {
      alert('Cannot merge a branch into itself.')
      return
    }

    if (confirm(`Are you sure you want to merge branch "${sourceBranch}" into "${activeBranch}"?`)) {
      try {
        const result = await mergeBranch(sourceBranch)
        if (result.conflicts) {
          alert(`Merge conflicts occurred! Conflict markers have been placed in the editor body. Please review, edit the text to resolve, and then click 'Commit' to complete the merge.`)
          onClose()
        } else {
          alert(`Branch "${sourceBranch}" successfully merged into "${activeBranch}".`)
        }
      } catch (err) {
        alert('Merge failed. Ensure both branches have at least one commit.')
      }
    }
  }

  const filteredBranches = branches.filter(b => 
    b.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const headHash = commits && commits.length > 0 ? commits[0].hash : 'empty'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Card */}
      <div className="w-full max-w-2xl bg-bg-card rounded-xl border border-border-low shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 font-ui-label">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-low flex justify-between items-center select-none">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-accent-blue text-[24px]">call_split</span>
            <div>
              <h2 className="font-display-md text-text-primary text-[15px] font-bold">Branch Manager</h2>
              <span className="text-[10px] text-text-muted mt-0.5 block">
                Current: <span className="font-mono text-accent-blue font-semibold">{activeBranch}</span> (HEAD at {headHash.slice(0, 7)})
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col md:flex-row h-[360px] overflow-hidden">
          
          {/* Branch List (Left side) */}
          <div className="flex-1 border-r border-border-low flex flex-col overflow-hidden bg-background/10">
            {/* Search branches */}
            <div className="p-3 bg-background/40 border-b border-border-low select-none">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2 top-2 text-[14px] text-text-muted">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search branches..."
                  className="w-full bg-bg-surface border border-border-low rounded pl-8 pr-3 py-1.5 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {filteredBranches.map(bName => {
                const isActive = bName === activeBranch
                return (
                  <div
                    key={bName}
                    onClick={() => handleSwitch(bName)}
                    className={`group flex items-center justify-between p-3 rounded hover:bg-bg-hover/40 border-l-2 cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-bg-hover/70 border-accent-green text-text-primary' 
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[16px] ${isActive ? 'text-accent-green' : 'text-text-muted'}`}>
                        {isActive ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                      <div>
                        <div className="font-mono text-[12px] font-semibold flex items-center gap-1.5">
                          {bName}
                          {isActive && (
                            <span className="bg-accent-green/10 text-accent-green text-[8px] font-bold px-1.5 py-0.2 rounded border border-accent-green/20">
                              HEAD
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Graph Preview (Right side) */}
          <div className="w-full md:w-64 bg-background/30 p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar select-none">
            <div className="flex flex-col gap-2">
              <span className="font-caption-caps text-caption-caps text-text-muted uppercase tracking-wider font-semibold">Graph Preview</span>
              <GraphViz />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-bg-surface/50 border-t border-border-low flex justify-between items-center select-none shrink-0 relative">
          <div className="text-[10px] font-mono text-text-muted flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[13px]">info</span>
            <span>Click branch row to checkout.</span>
          </div>

          <div className="flex items-center gap-3">
            {isCreating ? (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-150">
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="new-branch-name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateBranch()
                    if (e.key === 'Escape') {
                      setIsCreating(false)
                      setNewBranchName('')
                    }
                  }}
                  autoFocus
                  className="bg-bg-surface border border-border-low rounded px-2.5 py-1.5 text-[11px] font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-all w-36"
                />
                <button
                  onClick={handleCreateBranch}
                  className="px-3 py-1.5 bg-accent-green hover:brightness-110 text-on-primary font-mono text-[11px] font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer active:scale-95"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setNewBranchName('')
                  }}
                  className="px-3 py-1.5 bg-transparent border border-border-low text-text-secondary hover:text-text-primary font-mono text-[11px] font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Merge branches action */}
                <div className="relative">
                  <button 
                    onClick={() => setMergeSelectOpen(!mergeSelectOpen)}
                    className="px-4 py-2 bg-transparent border border-border-low text-accent-blue rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-bg-hover transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[14px]">merge</span>
                    Merge Branch
                  </button>
                  
                  {mergeSelectOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-bg-card border border-border-low rounded shadow-xl py-1 z-[110] font-sans text-[11px]">
                      <div className="px-3 py-1.5 text-text-muted font-caption-caps text-[9px] uppercase tracking-wider border-b border-border-low mb-1">
                        Select source branch:
                      </div>
                      {branches.filter(b => b !== activeBranch).map(b => (
                        <button
                          key={b}
                          onClick={() => handleMerge(b)}
                          className="w-full text-left px-3 py-1.5 text-text-primary hover:bg-bg-hover font-mono truncate"
                        >
                          merge {b} → {activeBranch}
                        </button>
                      ))}
                      {branches.length <= 1 && (
                        <div className="px-3 py-2 text-text-muted italic">
                          No other branches to merge.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 bg-accent-green hover:brightness-110 text-on-primary font-mono text-[11px] font-bold uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  New Branch
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
