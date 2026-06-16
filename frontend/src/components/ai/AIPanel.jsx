// frontend/src/components/ai/AIPanel.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNoteGitStore } from '../../store/notegitStore'
import client from '../../api/client'

export default function AIPanel() {
  const aiPanelOpen = useNoteGitStore(s => s.aiPanelOpen)
  const toggleAIPanel = useNoteGitStore(s => s.toggleAIPanel)
  const activeNoteId = useNoteGitStore(s => s.activeNoteId)
  const noteContent = useNoteGitStore(s => s.noteContent)
  const createBranch = useNoteGitStore(s => s.createBranch)

  const [chatHistory, setChatHistory] = useState([])
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // AI Telemetry states
  const [suggestion, setSuggestion] = useState(null) // { name, reason }
  const [evolution, setEvolution] = useState('')
  const [isEvolutionLoading, setIsEvolutionLoading] = useState(false)
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false)
  
  const chatBottomRef = useRef(null)

  // Run AI suggestions and evolution analysis whenever the active note changes
  useEffect(() => {
    if (activeNoteId && aiPanelOpen) {
      loadAISuggestions()
      loadAIEvolution()
    }
  }, [activeNoteId, aiPanelOpen])

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory])

  const loadAISuggestions = async () => {
    setIsSuggestionLoading(true)
    try {
      const res = await client.post('/ai/suggest-branch', {
        noteId: activeNoteId,
        content: noteContent
      })
      setSuggestion(res.data.suggestion)
    } catch (err) {
      console.error('Failed to load branch suggestions:', err)
      setSuggestion(null)
    } finally {
      setIsSuggestionLoading(false)
    }
  }

  const loadAIEvolution = async () => {
    setIsEvolutionLoading(true)
    try {
      const res = await client.post('/ai/evolution', { noteId: activeNoteId })
      setEvolution(res.data.analysis)
    } catch (err) {
      console.error('Failed to load note evolution analysis:', err)
      setEvolution('Telemetry offline. Add more commits to initialize progression analysis.')
    } finally {
      setIsEvolutionLoading(false)
    }
  }

  const handleSendChat = async () => {
    if (!question.trim()) return
    const userQ = question.trim()
    setQuestion('')
    
    setChatHistory(prev => [...prev, { role: 'user', text: userQ }])
    setIsLoading(true)

    try {
      const res = await client.post('/ai/chat', {
        question: userQ,
        content: noteContent
      })
      setChatHistory(prev => [...prev, { role: 'ai', text: res.data.reply }])
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: 'I encountered an error replying to your question.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyBranchSuggestion = async () => {
    if (suggestion) {
      const newBranchName = suggestion.name
      if (confirm(`Create and switch to recommended branch "${newBranchName}"?`)) {
        await createBranch(newBranchName)
        alert(`Branch "${newBranchName}" created!`)
        setSuggestion(null)
      }
    }
  }

  if (!aiPanelOpen) return null

  return (
    <div className="fixed top-topbar-height right-0 bottom-12 w-visualizer-width bg-bg-surface border-l border-border-low flex flex-col z-40 transform transition-transform duration-300 ease-in-out font-ui-label text-[12px] text-text-primary select-none select-none">
      
      {/* Drawer Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-border-low shrink-0 bg-bg-surface">
        <div className="flex items-center gap-2">
          <span className="text-accent-amber text-lg animate-pulse">✦</span>
          <span className="font-display-md text-[13px] font-bold text-text-primary tracking-tight">AI Assistant</span>
        </div>
        <button 
          onClick={toggleAIPanel}
          className="material-symbols-outlined text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          close
        </button>
      </div>

      {/* Main Drawer Body Scroll container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-bg-surface/50">
        
        {!activeNoteId ? (
          <div className="text-text-muted italic text-[11px] text-center py-10">
            Open a note in the explorer to activate AI features.
          </div>
        ) : (
          <>
            {/* 1. Suggestions Section */}
            <section className="space-y-2.5">
              <h3 className="font-caption-caps text-caption-caps text-text-muted tracking-wider uppercase font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-accent-amber rounded-full"></span>
                SUGGESTIONS
              </h3>
              
              {isSuggestionLoading ? (
                <div className="text-[10px] text-text-muted italic">Consulting branch advisor...</div>
              ) : suggestion ? (
                <div className="bg-bg-card border border-border-low rounded-md p-3 space-y-2.5 group hover:border-accent-amber/30 transition-all">
                  <div className="flex items-center gap-2 text-accent-amber font-semibold text-[11px]">
                    <span className="material-symbols-outlined text-[15px]">call_split</span>
                    Branch Recommendation
                  </div>
                  <p className="font-sans text-[11.5px] italic text-text-secondary leading-normal">
                    "I recommend branching into <code className="font-mono text-accent-amber bg-bg-surface px-1">{suggestion.name}</code>. {suggestion.reason}"
                  </p>
                  <button 
                    onClick={handleApplyBranchSuggestion}
                    className="w-full bg-accent-amber/10 hover:bg-accent-amber/20 border border-accent-amber/20 text-accent-amber py-1.5 rounded-sm font-caption-caps text-[10px] font-bold uppercase transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    Checkout Branch
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-text-muted italic bg-bg-card/20 border border-border-low/40 rounded p-2 text-center">
                  Theme is stable. No branching recommended.
                </div>
              )}
            </section>

            {/* 2. Evolution Analysis Section */}
            <section className="space-y-2.5">
              <h3 className="font-caption-caps text-caption-caps text-text-muted tracking-wider uppercase font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-accent-purple rounded-full"></span>
                EVOLUTION ANALYSIS
              </h3>
              
              <div className="bg-bg-card border border-border-low rounded-md p-3 space-y-2">
                {isEvolutionLoading ? (
                  <div className="text-[10px] text-text-muted italic">Analyzing historical growth...</div>
                ) : (
                  <p className="font-sans text-[11.5px] leading-relaxed text-text-secondary">
                    {evolution}
                  </p>
                )}
                
                {/* Visual growth graphs (mocked for aesthetics) */}
                <div className="flex justify-between items-end h-14 gap-1 px-1 border-b border-border-low/60 pt-2 shrink-0">
                  <div className="w-full bg-bg-hover hover:bg-accent-purple/40 transition-colors h-[25%]" title="Mon"></div>
                  <div className="w-full bg-bg-hover hover:bg-accent-purple/40 transition-colors h-[40%]" title="Tue"></div>
                  <div className="w-full bg-bg-hover hover:bg-accent-purple/40 transition-colors h-[20%]" title="Wed"></div>
                  <div className="w-full bg-bg-hover hover:bg-accent-purple/40 transition-colors h-[65%]" title="Thu"></div>
                  <div className="w-full bg-accent-purple/60 h-[80%]" title="Fri (Today)"></div>
                </div>
              </div>
            </section>

            {/* 3. Chat history Section */}
            <section className="space-y-2.5 border-t border-border-low pt-4 flex flex-col min-h-[160px]">
              <h3 className="font-caption-caps text-caption-caps text-text-muted tracking-wider uppercase font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-accent-blue rounded-full"></span>
                CHAT HISTORY
              </h3>
              
              <div className="flex-grow space-y-2.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1 select-text">
                {chatHistory.length === 0 ? (
                  <div className="text-text-muted italic text-[10px] py-4 text-center">
                    Ask me context questions about your note.
                  </div>
                ) : (
                  chatHistory.map((chat, idx) => (
                    <div key={idx} className={`flex flex-col gap-1 rounded p-2 ${
                      chat.role === 'user' 
                        ? 'bg-bg-hover/50 border border-border-low/40' 
                        : 'bg-bg-card border border-accent-blue/10 border-l-2 border-l-accent-blue text-text-secondary'
                    }`}>
                      <span className={`text-[8px] font-bold uppercase ${
                        chat.role === 'user' ? 'text-accent-blue' : 'text-accent-purple'
                      }`}>
                        {chat.role === 'user' ? 'USER' : 'AI'}
                      </span>
                      <p className={`font-sans text-[11px] leading-relaxed ${chat.role === 'ai' ? 'italic' : ''}`}>
                        {chat.text}
                      </p>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>
            </section>
          </>
        )}

      </div>

      {/* Chat Input Area (Fixed Bottom) */}
      {activeNoteId && (
        <div className="p-3 bg-bg-surface border-t border-border-low shrink-0 flex items-center gap-2 select-none">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendChat()
              }
            }}
            placeholder="Ask AI about notes..."
            rows="1"
            className="flex-grow bg-background border border-border-low rounded px-2.5 py-1.5 text-[11px] font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue transition-all resize-none max-h-12 custom-scrollbar"
          />
          <button 
            onClick={handleSendChat}
            disabled={isLoading || !question.trim()}
            className="w-8 h-8 rounded bg-accent-green hover:brightness-110 text-on-primary flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-[16px] font-bold">send</span>
          </button>
        </div>
      )}

    </div>
  )
}
