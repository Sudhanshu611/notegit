// frontend/src/components/layout/Topbar.jsx
import React, { useState } from 'react'
import { useNoteGitStore } from '../../store/notegitStore'

export default function Topbar() {
  const activeBranch = useNoteGitStore(s => s.activeBranch)
  const branches = useNoteGitStore(s => s.branches)
  const switchBranch = useNoteGitStore(s => s.switchBranch)
  const toggleAIPanel = useNoteGitStore(s => s.toggleAIPanel)
  const aiPanelOpen = useNoteGitStore(s => s.aiPanelOpen)
  const activeNoteId = useNoteGitStore(s => s.activeNoteId)
  
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleBranchSwitch = async (bName) => {
    setDropdownOpen(false)
    if (activeNoteId) {
      await switchBranch(bName)
    }
  }

  return (
    <header className="bg-bg-surface border-b border-border-low h-topbar-height flex justify-between items-center w-full px-gutter fixed top-0 z-50 select-none">
      {/* Brand Logo */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-blue font-bold text-[22px]">call_split</span>
          <span className="font-display-md text-display-md font-bold text-text-primary tracking-tight">NoteGit</span>
        </div>
        
        {/* Branch Selector Pill */}
        {activeNoteId && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center bg-bg-card hover:bg-bg-hover text-accent-blue text-ui-label font-ui-label px-3 py-1 rounded-full border border-border-low transition-all cursor-pointer active:scale-95 gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">call_split</span>
              <span className="font-mono font-medium">{activeBranch}</span>
              <span className="material-symbols-outlined text-[14px] text-text-muted">keyboard_arrow_down</span>
            </button>
            
            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-bg-card border border-border-low rounded shadow-xl py-1 z-50 font-ui-label animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1 text-[10px] text-text-muted uppercase tracking-widest border-b border-border-low mb-1">
                  Switch Branch
                </div>
                {branches.map(bName => (
                  <button
                    key={bName}
                    onClick={() => handleBranchSwitch(bName)}
                    className={`w-full text-left px-3 py-1.5 text-[12px] flex items-center justify-between hover:bg-bg-hover transition-colors ${
                      bName === activeBranch ? 'text-accent-green font-semibold' : 'text-text-secondary'
                    }`}
                  >
                    <span className="truncate">{bName}</span>
                    {bName === activeBranch && (
                      <span className="material-symbols-outlined text-accent-green text-[14px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleAIPanel}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-sm border transition-all cursor-pointer ${
            aiPanelOpen 
              ? 'bg-accent-amber/10 border-accent-amber/40 text-accent-amber' 
              : 'border-border-low hover:bg-bg-hover text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[16px] animate-pulse">auto_awesome</span>
          <span className="font-caption-caps text-caption-caps font-bold">✦ AI ASSISTANT</span>
        </button>

        <div className="w-px h-5 bg-border-low"></div>

        <div className="flex items-center gap-2">
          <button className="material-symbols-outlined text-text-secondary hover:text-text-primary hover:bg-bg-hover p-1 rounded-sm transition-colors cursor-pointer" title="Settings">
            settings
          </button>
          <button className="material-symbols-outlined text-text-secondary hover:text-text-primary hover:bg-bg-hover p-1 rounded-sm transition-colors cursor-pointer" title="Help">
            help
          </button>
        </div>
      </div>
    </header>
  )
}
