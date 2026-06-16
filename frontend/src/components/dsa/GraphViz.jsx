// frontend/src/components/dsa/GraphViz.jsx
import React from 'react'
import { useNoteGitStore } from '../../store/notegitStore'

export default function GraphViz() {
  const graph = useNoteGitStore(s => s.dsaState.graph) || { nodes: [], edges: [], branches: {}, activeBranch: 'main' }
  const { nodes, edges, branches, activeBranch } = graph

  if (!nodes || nodes.length === 0) {
    return (
      <div className="text-[10px] text-text-muted italic py-4 text-center select-none font-ui-label">
        No branches established. Create a commit or branch to construct graph.
      </div>
    )
  }

  // --- Layout Algorithm ---
  // Assign y-tracks for each branch
  const branchNames = Object.keys(branches)
  const branchTracks = {}
  branchNames.forEach((bName, idx) => {
    branchTracks[bName] = idx
  })

  // Assign positions to each node
  // We sort nodes oldest to newest. In the graph node array, nodes might be out of order.
  // We want to order them so that the chain renders from left to right.
  // Let's determine coordinates:
  const nodePositions = {}
  
  // Since nodes are returned from backend, we can sort them based on parent-child chains or simple indexing
  // Let's make a simple coordinate mapper.
  // To avoid complex DAG sorting, we can trace columns:
  const reversedNodes = [...nodes].reverse() // backend returned head-first, so reverse to oldest-first
  
  // Resolve track for each node:
  // Each node has a list of branches currently pointing to it, or inherits from its parent
  reversedNodes.forEach((node, colIdx) => {
    let track = 0 // default to main track (0)
    
    if (node.branches && node.branches.length > 0) {
      // If there are branches pointing to this node, use the first branch's track
      const mainBranchOfNode = node.branches.find(b => b === activeBranch) || node.branches[0]
      track = branchTracks[mainBranchOfNode] ?? 0
    } else if (node.parents && node.parents.length > 0) {
      // Inherit track of first parent
      const parentPos = nodePositions[node.parents[0]]
      if (parentPos) track = parentPos.track
    }

    nodePositions[node.id] = {
      x: 35 + colIdx * 45,
      y: 25 + track * 30,
      track
    }
  })

  // Generate SVG path for edges
  const renderEdges = () => {
    return edges.map((edge, idx) => {
      const start = nodePositions[edge.from]
      const end = nodePositions[edge.to]

      if (!start || !end) return null

      // Draw a curved line if fanning to a different branch track, else straight line
      if (start.y !== end.y) {
        // Draw cubic bezier curve or S-curve for smooth branch forks
        const midX = (start.x + end.x) / 2
        return (
          <path
            key={`edge-${idx}`}
            d={`M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`}
            className="stroke-vis-edge/40 fill-none"
            strokeWidth="1.5"
          />
        )
      } else {
        // Straight line on same track
        return (
          <line
            key={`edge-${idx}`}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            className="stroke-vis-edge/40"
            strokeWidth="1.5"
          />
        )
      }
    })
  }

  // Determine active HEAD node hash in the active branch
  const activeBranchHeadHash = branches[activeBranch]

  const svgWidth = Math.max(260, 50 + nodes.length * 45)
  const svgHeight = Math.max(70, 30 + branchNames.length * 30)

  return (
    <div className="flex flex-col gap-2.5">
      {/* SVG graph container */}
      <div className="w-full overflow-x-auto py-1 scrollbar-hide border border-border-low bg-background/25 rounded p-2">
        <svg 
          width={svgWidth} 
          height={svgHeight} 
          className="font-mono text-[8px] overflow-visible"
        >
          {/* Render Paths */}
          {renderEdges()}

          {/* Render Nodes */}
          {reversedNodes.map((node) => {
            const pos = nodePositions[node.id]
            if (!pos) return null

            const isHEAD = node.id === activeBranchHeadHash
            const isMerge = node.parents && node.parents.length > 1
            const hasBranchLabel = node.branches && node.branches.length > 0

            return (
              <g key={node.id} className="cursor-pointer">
                {/* Outer Ring for Active HEAD node or Merge Node */}
                {isHEAD && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="9"
                    className="fill-accent-green/10 stroke-accent-green"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                )}
                {isMerge && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="7.5"
                    className="fill-none stroke-accent-blue"
                    strokeWidth="1"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="5"
                  className={`${
                    isHEAD 
                      ? 'fill-accent-green stroke-bg-surface' 
                      : 'fill-bg-card stroke-vis-edge'
                  }`}
                  strokeWidth="1.5"
                />

                {/* Commit Hash Label */}
                <text
                  x={pos.x}
                  y={pos.y - 10}
                  textAnchor="middle"
                  className="fill-text-secondary font-bold text-[8px]"
                >
                  {node.label}
                </text>

                {/* Branch name label pills on the right of node */}
                {hasBranchLabel && (
                  <g transform={`translate(${pos.x + 8}, ${pos.y - 4})`}>
                    {node.branches.map((bName, bIdx) => {
                      const isActive = bName === activeBranch
                      return (
                        <g key={bName} transform={`translate(0, ${bIdx * 10})`}>
                          {/* Label Pill */}
                          <rect
                            rx="2"
                            width={bName.length * 5 + 6}
                            height="8"
                            className={`${
                              isActive
                                ? 'fill-accent-green/10 stroke-accent-green/30'
                                : 'fill-bg-hover stroke-border-low'
                            }`}
                            strokeWidth="0.5"
                          />
                          <text
                            x="3"
                            y="6"
                            className={`font-sans font-semibold text-[6px] ${
                              isActive ? 'fill-accent-green' : 'fill-text-secondary'
                            }`}
                          >
                            {bName}
                          </text>
                        </g>
                      )
                    })}
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="text-[10px] text-text-muted leading-relaxed font-ui-label border-t border-border-low/40 pt-2.5">
        DAG modeling branch topologies. Nodes map commits. Edges mark parent relationships. Active head node <span className="text-accent-green font-semibold">green ringed</span>, fanned branches trace splits, and merge nodes are double ringed.
      </div>
    </div>
  )
}
