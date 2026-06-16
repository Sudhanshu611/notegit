// frontend/src/components/dsa/StackViz.jsx
import React from 'react'
import { useNoteGitStore } from '../../store/notegitStore'

export default function StackViz() {
  const undoStack = useNoteGitStore(s => s.dsaState.undoStack) || []
  const redoStack = useNoteGitStore(s => s.dsaState.redoStack) || []

  // Max 5 items visible
  const visibleUndo = undoStack.slice(0, 5)
  const visibleRedo = redoStack.slice(0, 5)

  return (
    <div className="flex flex-col gap-3 font-mono text-[11px] text-text-secondary">
      
      {/* Undo and Redo columns side-by-side */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Undo Stack Column */}
        <div className="flex flex-col">
          <div className="text-[10px] text-text-muted font-bold font-caption-caps uppercase tracking-wider mb-2 select-none">
            Undo Stack
          </div>
          
          <div className="flex flex-col-reverse justify-end gap-1.5 border-2 border-dashed border-border-low p-2 rounded min-h-[160px] bg-background/20 relative">
            {visibleUndo.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-[9px] text-text-muted italic select-none">
                Empty Stack
              </div>
            ) : (
              visibleUndo.map((item, idx) => (
                <div 
                  key={idx}
                  className={`w-full py-1.5 px-2 bg-bg-card border rounded flex flex-col justify-center select-none text-[9px] truncate transition-all duration-300 ${
                    idx === 0 
                      ? 'border-accent-green bg-accent-green/5 text-accent-green font-semibold animate-slide-in'
                      : 'border-border-low text-text-secondary opacity-70'
                  }`}
                  title={item}
                >
                  <div className="flex items-center gap-1 font-mono">
                    <span className="text-[8px] opacity-40">[{visibleUndo.length - 1 - idx}]</span>
                    <span className="truncate">{item || 'empty state'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Redo Stack Column */}
        <div className="flex flex-col">
          <div className="text-[10px] text-text-muted font-bold font-caption-caps uppercase tracking-wider mb-2 select-none">
            Redo Stack
          </div>

          <div className="flex flex-col-reverse justify-end gap-1.5 border-2 border-dashed border-border-low p-2 rounded min-h-[160px] bg-background/20 relative">
            {visibleRedo.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-[9px] text-text-muted italic select-none">
                (empty)
              </div>
            ) : (
              visibleRedo.map((item, idx) => (
                <div 
                  key={idx}
                  className={`w-full py-1.5 px-2 bg-bg-card border rounded flex flex-col justify-center select-none text-[9px] truncate transition-all duration-300 ${
                    idx === 0 
                      ? 'border-accent-blue bg-accent-blue/5 text-accent-blue font-semibold animate-slide-in'
                      : 'border-border-low text-text-secondary opacity-70'
                  }`}
                  title={item}
                >
                  <div className="flex items-center gap-1 font-mono">
                    <span className="text-[8px] opacity-40">[{visibleRedo.length - 1 - idx}]</span>
                    <span className="truncate">{item || 'empty state'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <div className="text-[10px] text-text-muted leading-relaxed font-ui-label border-t border-border-low/40 pt-2.5">
        LIFO buffer tracks changes. Debounced writing pushes snapshots onto the <span className="text-accent-green font-semibold">Undo</span> stack. Undoing pops from Undo and pushes onto the <span className="text-accent-blue font-semibold">Redo</span> stack.
      </div>
    </div>
  )
}
