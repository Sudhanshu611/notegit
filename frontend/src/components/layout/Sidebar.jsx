// frontend/src/components/layout/Sidebar.jsx
import React, { useState } from 'react'
import { useNoteGitStore } from '../../store/notegitStore'
import NoteCard from './NoteCard'

export default function Sidebar({ onNoteOpened }) {
  const notes = useNoteGitStore(s => s.notes)
  const activeNoteId = useNoteGitStore(s => s.activeNoteId)
  const selectNote = useNoteGitStore(s => s.selectNote)
  const createNote = useNoteGitStore(s => s.createNote)
  
  const activeBranch = useNoteGitStore(s => s.activeBranch)
  const branches = useNoteGitStore(s => s.branches)
  const switchBranch = useNoteGitStore(s => s.switchBranch)

  const [searchQuery, setSearchQuery] = useState('')

  const handleNewNote = async () => {
    const title = prompt('Enter note title:')
    if (title && title.trim()) {
      const noteId = await createNote(title.trim())
      if (noteId) {
        await handleNoteSelect(noteId)
      }
    }
  }

  const handleNoteSelect = async (noteId) => {
    const title = await selectNote(noteId)
    if (onNoteOpened && title) {
      onNoteOpened(title) // triggers pulse animation in HashMapViz
    }
  }

  const notesList = Object.values(notes).filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <aside className="w-sidebar-width bg-bg-surface border-r border-border-low flex flex-col h-full select-none select-none">
      {/* Search & Actions */}
      <div className="p-4 border-b border-border-low flex flex-col gap-3">
        <button
          onClick={handleNewNote}
          className="w-full bg-transparent border border-dashed border-accent-green hover:bg-accent-green/5 text-accent-green hover:text-accent-green font-caption-caps text-caption-caps font-bold py-2 rounded-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Note
        </button>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-2 top-2 text-[16px] text-text-muted">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-bg-card border border-border-low rounded-sm pl-8 pr-2 py-1.5 text-ui-label text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue transition-all"
          />
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-6">
        {/* Notes list */}
        <section>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="font-caption-caps text-caption-caps text-text-muted tracking-widest uppercase">NOTES</span>
            <span className="text-[10px] text-text-muted font-mono">{notesList.length}</span>
          </div>
          
          {notesList.length === 0 ? (
            <div className="px-2 py-4 text-text-muted font-ui-label italic text-[11px]">
              No notes found.
            </div>
          ) : (
            <div className="space-y-0.5">
              {notesList.map(n => (
                <NoteCard
                  key={n.id}
                  note={n}
                  isActive={n.id === activeNoteId}
                  onSelect={handleNoteSelect}
                />
              ))}
            </div>
          )}
        </section>

        {/* Branches */}
        {activeNoteId && (
          <section className="animate-in fade-in duration-200">
            <div className="px-2 mb-2">
              <span className="font-caption-caps text-caption-caps text-text-muted tracking-widest uppercase">BRANCHES</span>
            </div>
            <div className="space-y-0.5 font-mono text-[12px]">
              {branches.map(bName => (
                <button
                  key={bName}
                  onClick={() => switchBranch(bName)}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-bg-hover transition-colors ${
                    bName === activeBranch ? 'text-accent-green' : 'text-text-secondary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {bName === activeBranch ? 'radio_button_checked' : 'radio_button_unchecked'}
                  </span>
                  <span className="truncate">{bName}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        <section>
          <div className="px-2 mb-2">
            <span className="font-caption-caps text-caption-caps text-text-muted tracking-widest uppercase">TAGS</span>
          </div>
          <div className="flex flex-wrap gap-1.5 px-2">
            <span className="px-2 py-0.5 bg-bg-card border border-border-low text-[10px] font-ui-label text-text-secondary rounded-full">#dsa</span>
            <span className="px-2 py-0.5 bg-bg-card border border-border-low text-[10px] font-ui-label text-text-secondary rounded-full">#notes</span>
            <span className="px-2 py-0.5 bg-bg-card border border-border-low text-[10px] font-ui-label text-text-secondary rounded-full">#git</span>
          </div>
        </section>
      </div>

      {/* Footer Profile Block */}
      <div className="p-3 border-t border-border-low bg-bg-surface mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-accent-green/10 border border-accent-green/30 flex items-center justify-center text-accent-green font-bold font-mono text-[13px]">
            NG
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-semibold text-text-primary truncate">NoteGit User</span>
            <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Local Workspace</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
