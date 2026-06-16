// frontend/src/components/dsa/DSAPanel.jsx
import React, { useState } from 'react'
import { useNoteGitStore } from '../../store/notegitStore'
import LinkedListViz from './LinkedListViz'
import StackViz from './StackViz'
import HashMapViz from './HashMapViz'
import ArrayViz from './ArrayViz'
import GraphViz from './GraphViz'

export default function DSAPanel() {
  const dsaPanelOpen = useNoteGitStore(s => s.dsaPanelOpen)
  const activeNoteId = useNoteGitStore(s => s.activeNoteId)

  // Expand states for each visualizer card
  const [expanded, setExpanded] = useState({
    linkedList: true,
    stack: true,
    hashMap: true,
    array: true,
    graph: true
  })

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!dsaPanelOpen) return null

  return (
    <aside className="w-visualizer-width bg-bg-surface border-l border-border-low flex flex-col h-full overflow-y-auto custom-scrollbar select-none select-none">
      {/* Header */}
      <div className="p-4 border-b border-border-low shrink-0 flex items-center justify-between">
        <span className="font-caption-caps text-caption-caps text-accent-green tracking-widest uppercase font-bold">DSA VISUALIZER</span>
        <span className="material-symbols-outlined text-text-muted text-[18px]">insights</span>
      </div>

      {!activeNoteId ? (
        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center text-text-muted">
          <span className="material-symbols-outlined text-[36px] mb-2 text-text-muted/40">bar_chart</span>
          <span className="text-[11px] font-ui-label italic">Open a note to load real-time data structure telemetry.</span>
        </div>
      ) : (
        <div className="p-4 space-y-4 flex-1">
          
          {/* 1. LINKED LIST — Version History */}
          <div className="bg-bg-card border border-border-low rounded-md overflow-hidden transition-all duration-150">
            <div 
              onClick={() => toggleExpand('linkedList')}
              className="px-3 py-2 bg-bg-surface/30 flex items-center justify-between border-b border-border-low/60 cursor-pointer hover:bg-bg-hover/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-accent-green rounded-full"></span>
                <span className="font-caption-caps text-[11px] text-text-primary uppercase tracking-wider font-semibold">Linked List - Version History</span>
              </div>
              <span className="material-symbols-outlined text-text-muted text-[16px]">
                {expanded.linkedList ? 'expand_less' : 'expand_more'}
              </span>
            </div>
            {expanded.linkedList && (
              <div className="p-3">
                <LinkedListViz />
              </div>
            )}
          </div>

          {/* 2. STACK — Undo/Redo */}
          <div className="bg-bg-card border border-border-low rounded-md overflow-hidden transition-all duration-150">
            <div 
              onClick={() => toggleExpand('stack')}
              className="px-3 py-2 bg-bg-surface/30 flex items-center justify-between border-b border-border-low/60 cursor-pointer hover:bg-bg-hover/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-accent-blue rounded-full"></span>
                <span className="font-caption-caps text-[11px] text-text-primary uppercase tracking-wider font-semibold">Stack - Undo / Redo</span>
              </div>
              <span className="material-symbols-outlined text-text-muted text-[16px]">
                {expanded.stack ? 'expand_less' : 'expand_more'}
              </span>
            </div>
            {expanded.stack && (
              <div className="p-3">
                <StackViz />
              </div>
            )}
          </div>

          {/* 3. HASH MAP — Note Index */}
          <div className="bg-bg-card border border-border-low rounded-md overflow-hidden transition-all duration-150">
            <div 
              onClick={() => toggleExpand('hashMap')}
              className="px-3 py-2 bg-bg-surface/30 flex items-center justify-between border-b border-border-low/60 cursor-pointer hover:bg-bg-hover/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-accent-purple rounded-full"></span>
                <span className="font-caption-caps text-[11px] text-text-primary uppercase tracking-wider font-semibold">Hash Map - Note Index</span>
              </div>
              <span className="material-symbols-outlined text-text-muted text-[16px]">
                {expanded.hashMap ? 'expand_less' : 'expand_more'}
              </span>
            </div>
            {expanded.hashMap && (
              <div className="p-3">
                <HashMapViz />
              </div>
            )}
          </div>

          {/* 4. ARRAY — Commit Timeline */}
          <div className="bg-bg-card border border-border-low rounded-md overflow-hidden transition-all duration-150">
            <div 
              onClick={() => toggleExpand('array')}
              className="px-3 py-2 bg-bg-surface/30 flex items-center justify-between border-b border-border-low/60 cursor-pointer hover:bg-bg-hover/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-accent-amber rounded-full"></span>
                <span className="font-caption-caps text-[11px] text-text-primary uppercase tracking-wider font-semibold">Commit Array - Indexing</span>
              </div>
              <span className="material-symbols-outlined text-text-muted text-[16px]">
                {expanded.array ? 'expand_less' : 'expand_more'}
              </span>
            </div>
            {expanded.array && (
              <div className="p-3">
                <ArrayViz />
              </div>
            )}
          </div>

          {/* 5. GRAPH — Branch & Merge */}
          <div className="bg-bg-card border border-border-low rounded-md overflow-hidden transition-all duration-150">
            <div 
              onClick={() => toggleExpand('graph')}
              className="px-3 py-2 bg-bg-surface/30 flex items-center justify-between border-b border-border-low/60 cursor-pointer hover:bg-bg-hover/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-accent-blue rounded-full"></span>
                <span className="font-caption-caps text-[11px] text-text-primary uppercase tracking-wider font-semibold">Branch Graph - Branches</span>
              </div>
              <span className="material-symbols-outlined text-text-muted text-[16px]">
                {expanded.graph ? 'expand_less' : 'expand_more'}
              </span>
            </div>
            {expanded.graph && (
              <div className="p-3">
                <GraphViz />
              </div>
            )}
          </div>

        </div>
      )}
    </aside>
  )
}
