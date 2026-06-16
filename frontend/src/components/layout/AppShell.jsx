// frontend/src/components/layout/AppShell.jsx
import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useNoteGitStore } from '../../store/notegitStore'
import client from '../../api/client'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import NoteEditor from '../editor/NoteEditor'
import CommitBar from '../editor/CommitBar'
import CommitTimeline from '../editor/CommitTimeline'
import DSAPanel from '../dsa/DSAPanel'
import DiffModal from '../modals/DiffModal'
import BranchManager from '../modals/BranchManager'
import AIPanel from '../ai/AIPanel'

export default function AppShell() {
  const fetchNotes = useNoteGitStore(s => s.fetchNotes)
  const activeNoteId = useNoteGitStore(s => s.activeNoteId)
  const selectNote = useNoteGitStore(s => s.selectNote)
  const dsaPanelOpen = useNoteGitStore(s => s.dsaPanelOpen)
  const toggleDSAPanel = useNoteGitStore(s => s.toggleDSAPanel)
  const aiPanelOpen = useNoteGitStore(s => s.aiPanelOpen)

  // Branch Manager Modal State
  const [branchManagerOpen, setBranchManagerOpen] = useState(false)
  // Active socket connection state
  const [socketConnected, setSocketConnected] = useState(false)

  // HashMap node pulsing animation effect hook
  const [pulseAnimationClass, setPulseAnimationClass] = useState('')

  useEffect(() => {
    // Initial fetch of notes registry
    fetchNotes()

    let socket = null

    if (!import.meta.env.PROD) {
      // Setup Socket.io client for real-time local file watcher sync
      socket = io('http://localhost:3001')

      socket.on('connect', () => {
        setSocketConnected(true)
        console.log('Connected to NoteGit file watcher daemon')
      })

      socket.on('disconnect', () => {
        setSocketConnected(false)
      })

      socket.on('note:changed', async (data) => {
        const currentActiveId = useNoteGitStore.getState().activeNoteId
        if (data.noteId === currentActiveId) {
          // Sync metadata only to protect unsaved/merging editing content in the active editor
          try {
            const metaRes = await client.get(`/notes/${currentActiveId}`)
            const meta = metaRes.data
            const commitsRes = await client.get(`/commits/${currentActiveId}`)
            const { commits, dsa } = commitsRes.data
            const branchesRes = await client.get(`/branches/${currentActiveId}`)
            const { branches, activeBranch } = branchesRes.data

            useNoteGitStore.setState(s => ({
              noteTitle: meta.title,
              activeBranch,
              branches,
              commits,
              dsaState: {
                ...s.dsaState,
                linkedList: dsa.linkedList,
                array: dsa.array,
                graph: dsa.graph
              }
            }))
          } catch (err) {
            console.error('Failed to sync active note metadata:', err)
          }
        } else {
          fetchNotes()
        }
      })

      socket.on('index:changed', () => {
        fetchNotes()
      })
    }

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [fetchNotes, selectNote])

  // Trigger pulse animation when note is selected and loaded
  const handleNoteOpened = (title) => {
    console.log(`Hashed note loaded: ${title}`)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-base text-text-primary font-sans select-none">
      
      {/* 1. App Header/Topbar */}
      <Topbar onSettingsOpen={() => setBranchManagerOpen(true)} />

      {/* 2. Main Workspace Layout */}
      <div className="flex flex-1 pt-topbar-height pb-12 overflow-hidden relative">
        
        {/* Left column sidebar */}
        <Sidebar onNoteOpened={handleNoteOpened} />

        {/* Center column workspace (Editor) */}
        <div className="flex-1 flex flex-col min-w-0 bg-background relative border-r border-border-low">
          <NoteEditor />
          <CommitBar />
          <CommitTimeline />
        </div>

        {/* Right column utilities (DSAPanel + overlaying AIPanel drawer) */}
        <div className="flex-shrink-0 relative flex h-full">
          <DSAPanel />
          <AIPanel />
        </div>

      </div>

      {/* 3. Status Bar/Footer */}
      <footer className="bg-bg-surface text-text-secondary fixed bottom-0 w-full z-50 h-12 border-t border-border-low px-gutter flex justify-between items-center select-none text-[11px] font-caption-caps">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setBranchManagerOpen(true)}
            className="flex items-center gap-2 hover:text-text-primary transition-colors cursor-pointer active:scale-95"
            title="Open Branch Manager"
          >
            <span className="material-symbols-outlined text-[16px] text-accent-blue">call_split</span>
            <span>Branches</span>
          </button>
          
          <button 
            onClick={toggleDSAPanel}
            className={`flex items-center gap-2 transition-colors cursor-pointer active:scale-95 ${
              dsaPanelOpen ? 'text-accent-green' : 'text-text-muted hover:text-text-primary'
            }`}
            title="Toggle DSA Visualizer Panel"
          >
            <span className="material-symbols-outlined text-[16px]">insights</span>
            <span>DSA Visualizer</span>
          </button>
        </div>

        <div className="flex items-center gap-5 text-[10px] text-text-muted">
          <div className="flex items-center gap-1">
            <span>Spaces: 4</span>
          </div>
          <div className="flex items-center gap-1">
            <span>UTF-8</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-accent-green animate-pulse' : 'bg-accent-red'}`}></span>
            <span className={socketConnected ? 'text-accent-green font-semibold' : 'text-accent-red font-semibold'}>
              {socketConnected ? 'WATCHER ONLINE' : 'WATCHER OFFLINE'}
            </span>
          </div>
        </div>
      </footer>

      {/* 4. Modals Overlays */}
      <DiffModal />
      
      <BranchManager 
        isOpen={branchManagerOpen} 
        onClose={() => setBranchManagerOpen(false)} 
      />

    </div>
  )
}
