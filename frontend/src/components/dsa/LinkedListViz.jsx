// frontend/src/components/dsa/LinkedListViz.jsx
import React from 'react'
import { useNoteGitStore } from '../../store/notegitStore'

export default function LinkedListViz() {
  const linkedList = useNoteGitStore(s => s.dsaState.linkedList) || []
  const activeBranch = useNoteGitStore(s => s.activeBranch)

  // Show first 3 nodes + NULL tail
  const visibleNodes = linkedList.slice(0, 3)
  const showEllipsis = linkedList.length > 3

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3 overflow-x-auto py-3 px-1 scrollbar-hide">
        {visibleNodes.length === 0 ? (
          <div className="text-[10px] text-text-muted italic py-2">
            No history nodes recorded. Commit changes to generate nodes.
          </div>
        ) : (
          <>
            {visibleNodes.map((node, index) => (
              <React.Fragment key={node.hash}>
                {/* Linked List Node */}
                <div 
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-10 bg-bg-surface/50 border rounded-md relative select-none animate-slide-in ${
                    index === 0 
                      ? 'border-accent-green shadow-[0_0_8px_rgba(61,220,132,0.2)]' 
                      : 'border-border-low'
                  }`}
                >
                  {index === 0 && (
                    <span className="absolute top-[-14px] text-[8px] font-mono text-accent-green uppercase font-semibold">
                      HEAD
                    </span>
                  )}
                  <span className={`font-mono text-[9px] font-bold ${index === 0 ? 'text-accent-green' : 'text-text-secondary'}`}>
                    {node.hash}
                  </span>
                  <span className="text-[8px] text-text-muted truncate w-14 text-center">
                    {node.message}
                  </span>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 flex items-center text-text-muted">
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
              </React.Fragment>
            ))}

            {showEllipsis ? (
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="text-[11px] font-mono text-text-muted">...</div>
                <div className="flex-shrink-0 flex items-center text-text-muted">
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
              </div>
            ) : null}

            {/* NULL/Tail node */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full border border-dashed border-border-low bg-transparent flex items-center justify-center text-[9px] font-mono text-text-muted">
              NULL
            </div>
          </>
        )}
      </div>

      <div className="text-[10px] text-text-muted leading-relaxed font-ui-label border-t border-border-low/40 pt-2.5">
        Each commit is stored in a Singly Linked List of historical states. The active pointer tracking the <span className="text-accent-green font-semibold">HEAD</span> node represents the current version.
      </div>
    </div>
  )
}
