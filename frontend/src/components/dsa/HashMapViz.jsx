// frontend/src/components/dsa/HashMapViz.jsx
import React, { useEffect, useState } from 'react'
import { useNoteGitStore } from '../../store/notegitStore'

export default function HashMapViz() {
  const hashMap = useNoteGitStore(s => s.dsaState.hashMap)
  const notes = useNoteGitStore(s => s.notes)
  const noteTitle = useNoteGitStore(s => s.noteTitle)
  const activeNoteId = useNoteGitStore(s => s.activeNoteId)
  
  const [pulseSlot, setPulseSlot] = useState(null)
  const [lastHashedTitle, setLastHashedTitle] = useState('')

  // Hash calculation (djb2) for visual feedback
  const djb2Hash = (key, capacity = 8) => {
    if (!key) return 0
    let hash = 5381
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) + hash) + key.charCodeAt(i)
      hash = hash & hash // convert to 32-bit int
    }
    return Math.abs(hash) % capacity
  }

  const activeSlot = activeNoteId && noteTitle ? djb2Hash(noteTitle, hashMap.capacity || 8) : null

  // Trigger pulse animation when note title changes or note is loaded
  useEffect(() => {
    if (activeNoteId && noteTitle && noteTitle !== lastHashedTitle) {
      const slot = djb2Hash(noteTitle, hashMap.capacity || 8)
      setPulseSlot(slot)
      setLastHashedTitle(noteTitle)

      const timer = setTimeout(() => {
        setPulseSlot(null)
      }, 600)
      
      return () => clearTimeout(timer)
    }
  }, [noteTitle, activeNoteId])

  const capacity = hashMap.capacity || 8
  const buckets = hashMap.buckets || []

  // Ensure buckets are padded to the correct capacity
  const paddedBuckets = new Array(capacity).fill(null).map((_, i) => {
    const existing = buckets.find(b => b.index === i)
    return existing || { index: i, entries: [], filled: false }
  })

  return (
    <div className="flex flex-col gap-3 font-mono text-[11px] text-text-secondary select-none select-none">
      {/* Hash computation telemetry display */}
      <div className="bg-background/40 border border-border-low/60 rounded px-2.5 py-1.5 flex flex-col gap-1 text-[10px]">
        {activeNoteId && noteTitle ? (
          <>
            <div className="flex justify-between items-center text-text-primary">
              <span className="text-text-muted">key:</span>
              <span className="font-bold truncate max-w-[180px]">"{noteTitle}"</span>
            </div>
            <div className="flex justify-between items-center border-t border-border-low/20 pt-1 mt-1 font-mono text-[9px] text-text-muted">
              <span>djb2_hash("{noteTitle.slice(0, 8)}...") % {capacity}</span>
              <span className="material-symbols-outlined text-[12px] text-accent-purple">arrow_right_alt</span>
              <span className="text-accent-purple font-bold">slot {activeSlot}</span>
            </div>
          </>
        ) : (
          <span className="text-text-muted italic text-[9px] py-1 text-center">
            No note selected. Hash engine idle.
          </span>
        )}
      </div>

      {/* Grid of Buckets */}
      <div className="grid grid-cols-8 gap-1 border border-border-low/80 p-1 bg-background/20 rounded-md">
        {paddedBuckets.map((bucket, index) => {
          const isPulse = index === pulseSlot
          const isActive = index === activeSlot
          const isFilled = bucket.filled

          return (
            <div
              key={index}
              className={`h-9 border rounded-sm flex flex-col items-center justify-center relative transition-all duration-300 ${
                isPulse
                  ? 'border-accent-purple bg-accent-purple/20 animate-pulse-purple'
                  : isActive
                  ? 'border-accent-purple/80 bg-accent-purple/10 text-accent-purple'
                  : isFilled
                  ? 'border-border-low bg-accent-purple/5'
                  : 'border-border-low bg-vis-node/20'
              }`}
              title={bucket.entries.length > 0 ? `Bucket ${index}: ${bucket.entries.join(', ')}` : `Bucket ${index} (empty)`}
            >
              {/* Bucket Index */}
              <span className="text-[8px] text-text-muted absolute top-0.5">{index}</span>
              
              {/* Bucket Fill Indicator */}
              {isFilled && (
                <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-accent-purple' : 'bg-accent-purple/40'} mt-3`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Collision list indicator */}
      {activeNoteId && activeSlot !== null && paddedBuckets[activeSlot]?.entries.length > 1 && (
        <div className="text-[9px] text-accent-purple bg-accent-purple/5 border border-accent-purple/10 rounded px-2 py-1 flex items-center gap-1.5 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[13px] animate-pulse">link</span>
          <span>
            Collision in slot {activeSlot}! Chaining: {paddedBuckets[activeSlot].entries.join(' → ')}
          </span>
        </div>
      )}

      <div className="text-[10px] text-text-muted leading-relaxed font-ui-label border-t border-border-low/40 pt-2.5">
        HashMap indices notes by name for O(1) retrieval. Uses a <span className="text-accent-purple font-semibold">djb2</span> hashing pipeline with separate chaining for bucket collisions.
      </div>
    </div>
  )
}
