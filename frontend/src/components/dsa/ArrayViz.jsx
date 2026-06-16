// frontend/src/components/dsa/ArrayViz.jsx
import React from 'react'
import { useNoteGitStore } from '../../store/notegitStore'

export default function ArrayViz() {
  const arrayState = useNoteGitStore(s => s.dsaState.array) || { commits: [], headIndex: 0 }
  const visibleCommits = arrayState.commits || []

  // Create an array representing 4 slots
  const slots = new Array(4).fill(null).map((_, i) => visibleCommits[i] || null)

  return (
    <div className="flex flex-col gap-3 font-mono text-[11px] text-text-secondary select-none select-none">
      
      {/* Array Display */}
      <div className="flex flex-col items-center gap-1.5 py-2">
        <div className="flex items-center gap-2">
          {slots.map((commit, index) => (
            <div key={index} className="flex flex-col items-center w-14">
              
              {/* Index label [n] */}
              <span className="text-[9px] text-text-muted mb-1 select-none">
                [{index}]
              </span>

              {/* Commit cell container */}
              <div 
                className={`w-14 h-9 border rounded-sm flex items-center justify-center relative transition-all duration-300 ${
                  commit 
                    ? index === 0
                      ? 'border-accent-green bg-accent-green/5 text-accent-green font-semibold animate-slide-in shadow-[0_0_6px_rgba(61,220,132,0.1)]'
                      : 'border-border-low bg-bg-card text-text-secondary'
                    : 'border-dashed border-border-low bg-transparent text-text-muted'
                }`}
              >
                {commit ? (
                  <span className="text-[9px] font-mono select-all">
                    {commit.hash}
                  </span>
                ) : (
                  <span className="text-[8px] text-text-muted opacity-40">-</span>
                )}
              </div>

              {/* HEAD Arrow Indicator underneath [0] */}
              {index === 0 && commit && (
                <div className="flex flex-col items-center mt-1 animate-bounce select-none">
                  <span className="text-[9px] text-accent-green font-bold leading-none">▲</span>
                  <span className="text-[8px] text-accent-green font-mono font-bold leading-none">HEAD</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-text-muted leading-relaxed font-ui-label border-t border-border-low/40 pt-2.5 mt-2">
        Chronological index mapping. New commits prepend at index <span className="text-accent-green font-semibold">[0]</span> with a slide right vector, shifting existing elements.
      </div>
    </div>
  )
}
