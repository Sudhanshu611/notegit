// frontend/src/components/layout/NoteCard.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNoteGitStore } from '../../store/notegitStore'

export default function NoteCard({ note, isActive, onSelect }) {
  const deleteNote = useNoteGitStore(s => s.deleteNote)
  const createBranch = useNoteGitStore(s => s.createBranch)
  const activeBranch = useNoteGitStore(s => s.activeBranch)
  
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const [isRenaming, setIsRenaming] = useState(false)
  const [titleInput, setTitleInput] = useState(note.title)
  
  const menuRef = useRef(null)
  const cardRef = useRef(null)

  // Custom context menu handler
  const handleContextMenu = (e) => {
    e.preventDefault()
    setMenuPos({ x: e.clientX, y: e.clientY })
    setMenuOpen(true)
  }

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('click', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [menuOpen])

  const handleDelete = async (e) => {
    e.stopPropagation()
    setMenuOpen(false)
    if (confirm(`Are you sure you want to delete note "${note.title}"?`)) {
      await deleteNote(note.id)
    }
  }

  const handleCreateBranch = async (e) => {
    e.stopPropagation()
    setMenuOpen(false)
    const bName = prompt('Enter new branch name (lowercase, kebab-case):')
    if (bName) {
      // Switch to active note first then branch
      await onSelect(note.id)
      await createBranch(bName.trim().toLowerCase())
    }
  }

  const handleCardClick = () => {
    if (!isRenaming) {
      onSelect(note.id)
    }
  }

  return (
    <div className="relative" ref={cardRef}>
      <div
        onClick={handleCardClick}
        onContextMenu={handleContextMenu}
        className={`group relative flex items-center justify-between px-3 py-2.5 transition-all duration-150 cursor-pointer ${
          isActive 
            ? 'bg-bg-hover border-l-2 border-accent-green text-text-primary' 
            : 'hover:bg-bg-hover/50 text-text-secondary hover:text-text-primary border-l-2 border-transparent'
        }`}
      >
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-[16px] shrink-0 ${isActive ? 'text-accent-green' : 'text-text-muted'}`}>
              description
            </span>
            <span className="truncate font-mono text-[13px] font-semibold tracking-tight">
              {note.title}
            </span>
          </div>
          <span className="text-[10px] text-text-muted font-ui-label mt-1 ml-6">
            active: {activeBranch}
          </span>
        </div>

        {/* More icon */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMenuPos({ x: e.clientX, y: e.clientY })
            setMenuOpen(true)
          }}
          className="material-symbols-outlined text-[14px] text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
        >
          more_vert
        </button>
      </div>

      {/* Custom Context Menu Portal Overlay */}
      {menuOpen && (
        <div
          ref={menuRef}
          style={{ top: `${menuPos.y}px`, left: `${menuPos.x}px` }}
          className="fixed bg-bg-card border border-border-low rounded shadow-xl py-1 z-[9999] w-36 font-ui-label text-[11px] animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            onClick={handleCreateBranch}
            className="w-full text-left px-3 py-1.5 hover:bg-bg-hover text-text-primary flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[14px] text-accent-blue">call_split</span>
            Create Branch
          </button>
          
          <div className="h-px bg-border-low my-1"></div>
          
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-1.5 hover:bg-accent-red hover:text-white text-accent-red flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
            Delete Note
          </button>
        </div>
      )}
    </div>
  )
}
