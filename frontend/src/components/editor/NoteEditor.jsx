// frontend/src/components/editor/NoteEditor.jsx
import React, { useEffect, useState } from 'react'
import { useNoteGitStore } from '../../store/notegitStore'
import client from '../../api/client'

export default function NoteEditor() {
  const activeNoteId = useNoteGitStore(s => s.activeNoteId)
  const noteContent = useNoteGitStore(s => s.noteContent)
  const noteTitle = useNoteGitStore(s => s.noteTitle)
  const recordEditorChangeDebounced = useNoteGitStore(s => s.recordEditorChangeDebounced)
  const performUndo = useNoteGitStore(s => s.performUndo)
  const performRedo = useNoteGitStore(s => s.performRedo)
  const fetchNotes = useNoteGitStore(s => s.fetchNotes)

  const [localTitle, setLocalTitle] = useState(noteTitle)

  // Sync title when active note changes
  useEffect(() => {
    setLocalTitle(noteTitle)
  }, [noteTitle, activeNoteId])

  const handleTitleChange = async (e) => {
    const newTitle = e.target.value
    setLocalTitle(newTitle)
    
    // Save note title change to backend
    if (activeNoteId) {
      try {
        await client.post(`/notes/${activeNoteId}`, { title: newTitle })
        useNoteGitStore.setState({ noteTitle: newTitle })
        await fetchNotes()
      } catch (err) {
        console.error('Failed to update title:', err)
      }
    }
  }

  const handleContentChange = (e) => {
    const newContent = e.target.value
    recordEditorChangeDebounced(newContent)
  }

  const handleKeyDown = (e) => {
    // Ctrl + Z (Undo)
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      performUndo()
    }
    // Ctrl + Shift + Z or Ctrl + Y (Redo)
    if (
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') || 
      (e.ctrlKey && e.key.toLowerCase() === 'y')
    ) {
      e.preventDefault()
      performRedo()
    }
  }

  if (!activeNoteId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-8 select-none select-none">
        <span className="material-symbols-outlined text-[64px] mb-4 text-accent-blue/30">call_split</span>
        <h2 className="font-display-md text-text-primary text-[16px] mb-2 font-bold uppercase tracking-wider">No Commit History Yet</h2>
        <p className="text-[12px] max-w-sm text-center font-ui-label leading-relaxed">
          Create or open a note in the sidebar to start version-controlling your thoughts in real-time.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden relative">
      {/* File Path Indicator */}
      <div className="h-10 border-b border-border-low flex items-center px-6 bg-bg-surface select-none">
        <div className="flex items-center gap-2 text-text-secondary font-mono text-[11px]">
          <span className="material-symbols-outlined text-[14px]">folder</span>
          <span>notes</span>
          <span className="text-text-muted">/</span>
          <span className="text-text-primary font-semibold truncate">{localTitle}.md</span>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-editor-pad-x py-editor-pad-y flex justify-center">
        <div className="w-full max-w-3xl flex flex-col h-full relative">
          
          {/* Notion-style left margin rule */}
          <div className="absolute left-[-24px] top-0 bottom-0 w-px bg-border-low" />

          {/* Editable Title */}
          <input
            type="text"
            value={localTitle}
            onChange={handleTitleChange}
            className="w-full bg-transparent border-none text-display-lg font-display-lg font-bold text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-0 mb-6 p-0"
            placeholder="Untitled Note"
          />

          {/* Editor Body Textarea */}
          <div className="flex-grow relative flex flex-col">
            <textarea
              value={noteContent}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="Start writing... (Markdown supported)"
              className="w-full flex-grow bg-transparent border-none resize-none text-[14px] font-mono leading-[1.8] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-0 p-0"
            />
            {/* Blinking cursor simulation if content is empty */}
            {noteContent.length === 0 && (
              <div className="absolute left-0 top-1.5 w-1 h-5 cursor-blink pointer-events-none" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
