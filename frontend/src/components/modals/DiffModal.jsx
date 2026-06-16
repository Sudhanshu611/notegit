// frontend/src/components/modals/DiffModal.jsx
import React from 'react'
import { useNoteGitStore } from '../../store/notegitStore'

export default function DiffModal() {
  const diffModalOpen = useNoteGitStore(s => s.diffModalOpen)
  const diffData = useNoteGitStore(s => s.diffData)
  const closeDiffModal = useNoteGitStore(s => s.closeDiffModal)
  const restoreCommit = useNoteGitStore(s => s.restoreCommit)

  if (!diffModalOpen || !diffData) return null

  const { from, to, diff, aiSummary, commitMessage } = diffData

  const handleRestore = async () => {
    if (confirm(`Restore note content to commit version ${to}?`)) {
      await restoreCommit(to)
      closeDiffModal()
    }
  }

  // Count additions and deletions
  const additions = diff.filter(line => line.type === 'added').length
  const deletions = diff.filter(line => line.type === 'removed').length

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Card */}
      <div className="w-full max-w-3xl bg-bg-surface border border-border-low shadow-2xl flex flex-col max-h-[85vh] overflow-hidden rounded-xl animate-in zoom-in-95 duration-200 font-ui-label">
        
        {/* Modal Header */}
        <header className="flex justify-between items-center w-full px-6 py-4 border-b border-border-low bg-bg-surface shrink-0 select-none">
          <div className="flex flex-col min-w-0 pr-2">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-accent-green">history</span>
              <h2 className="font-display-md text-text-primary text-[15px] font-bold">Diff View</h2>
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <code className="px-2 py-0.5 bg-bg-card border border-border-low text-text-muted">{from.slice(0, 7)}</code>
                <span className="material-symbols-outlined text-[12px] text-text-muted">trending_flat</span>
                <code className="px-2 py-0.5 bg-accent-green/10 border border-accent-green/20 text-accent-green">{to.slice(0, 7)}</code>
              </div>
            </div>
            <span className="text-[10px] text-text-muted mt-1 font-mono truncate">
              Commit message: "{commitMessage}"
            </span>
          </div>
          
          <button 
            onClick={closeDiffModal}
            className="text-text-muted hover:text-text-primary transition-colors p-1"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        {/* Modal Main Content (Line level code diff rendering) */}
        <main className="flex-1 overflow-y-auto bg-background p-6 font-mono text-[13px] leading-relaxed custom-scrollbar">
          <div className="border border-border-low rounded overflow-hidden divide-y divide-border-low/30">
            {diff.map((line, idx) => {
              const isAdded = line.type === 'added'
              const isRemoved = line.type === 'removed'
              
              return (
                <div 
                  key={idx} 
                  className={`flex ${
                    isAdded 
                      ? 'bg-accent-green/10 text-accent-green' 
                      : isRemoved 
                      ? 'bg-accent-red/10 text-accent-red' 
                      : 'text-text-secondary hover:bg-bg-hover/30'
                  }`}
                >
                  {/* Line Number Gutter */}
                  <div className="w-12 text-right pr-4 text-text-muted select-none border-r border-border-low/40 bg-bg-surface/30 py-1 text-[10px]">
                    {idx + 1}
                  </div>
                  
                  {/* Line Content */}
                  <div className="px-4 py-1 whitespace-pre-wrap break-all flex gap-2 font-mono">
                    <span className="select-none opacity-40">
                      {isAdded ? '+' : isRemoved ? '-' : ' '}
                    </span>
                    <span>{line.content}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* AI Generated Comparative Summary block */}
          {aiSummary && (
            <div className="mt-6 p-4 bg-bg-surface border border-dashed border-accent-amber/30 rounded relative overflow-hidden group select-none">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-[48px] text-accent-amber">auto_awesome</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-accent-amber text-[16px]">auto_awesome</span>
                <span className="font-caption-caps text-caption-caps text-accent-amber uppercase tracking-widest font-bold">Gemini AI Summary</span>
              </div>
              <p className="font-ai-prose text-ai-prose italic text-accent-amber/90 leading-relaxed font-sans">
                "{aiSummary}"
              </p>
            </div>
          )}
        </main>

        {/* Modal Footer actions */}
        <footer className="px-6 py-4 border-t border-border-low bg-bg-surface shrink-0 flex justify-between items-center select-none">
          <div className="flex items-center gap-3 text-[11px] font-mono text-text-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent-green"></span>
              <span>{additions} addition{additions !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent-red"></span>
              <span>{deletions} deletion{deletions !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={closeDiffModal}
              className="px-4 py-2 border border-border-low text-text-primary hover:bg-bg-hover rounded-sm transition-all active:scale-[0.98] cursor-pointer text-[12px] font-semibold"
            >
              Cancel
            </button>
            <button 
              onClick={handleRestore}
              className="px-5 py-2 bg-accent-amber hover:brightness-110 text-on-primary font-mono text-[11px] font-bold uppercase tracking-wide rounded-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              Restore Version
            </button>
          </div>
        </footer>

      </div>
    </div>
  )
}
