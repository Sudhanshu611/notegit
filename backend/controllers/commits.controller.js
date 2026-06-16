// backend/controllers/commits.controller.js
import crypto from 'crypto'
import { StorageEngine } from '../storage/StorageEngine.js'
import { CommitLinkedList } from '../core/LinkedList.js'
import { CommitArray } from '../core/CommitArray.js'
import { BranchGraph } from '../core/BranchGraph.js'

// In-memory per-note state (persisted to disk on change)
export const noteStates = new Map() // noteId → { list, array, branchGraph }

export async function getNoteState(noteId) {
  if (!noteStates.has(noteId)) {
    const commits = await StorageEngine.getAllCommits(noteId)
    const list    = new CommitLinkedList()
    const array   = new CommitArray()
    const branchGraph = new BranchGraph()

    // Re-hydrate ordered list from disk (oldest first)
    const oldestFirst = [...commits].reverse()
    oldestFirst.forEach(c => {
      list.push(c.hash, c.message, c.content, c.parent)
      array.prepend(c)
      branchGraph.addCommit(c.hash, c.message, c.parents || (c.parent ? [c.parent] : []))
    })

    // Load branches into graph
    const meta = await StorageEngine.getNote(noteId)
    if (meta) {
      branchGraph.HEAD = meta.currentBranch ?? 'main'
      if (meta.branches) {
        Object.entries(meta.branches).forEach(([bName, bHash]) => {
          if (bHash) {
            branchGraph.branches.set(bName, bHash)
            const node = branchGraph.nodes.get(bHash)
            if (node) {
              node.branches = node.branches ?? []
              if (!node.branches.includes(bName)) {
                node.branches.push(bName)
              }
            }
          } else {
            branchGraph.branches.set(bName, null)
          }
        })
      }
    }

    noteStates.set(noteId, { list, array, branchGraph })
  }
  return noteStates.get(noteId)
}

export async function createCommit(req, res) {
  try {
    const { id } = req.params
    const { message, content } = req.body

    const hash = crypto.createHash('sha1')
                       .update(content + Date.now())
                       .digest('hex')
                       .slice(0, 7)

    const { list, array, branchGraph } = await getNoteState(id)
    
    // Find current parent based on the active branch HEAD hash
    const meta = await StorageEngine.getNote(id)
    const currentBranchName = meta.currentBranch ?? 'main'
    const parentHash = branchGraph.branches.get(currentBranchName) ?? null

    const parents = parentHash ? [parentHash] : []
    if (meta && meta.pendingMerge && meta.pendingMerge.sourceHash) {
      parents.push(meta.pendingMerge.sourceHash)
    }

    const commit = {
      hash,
      message: message || `Update at ${new Date().toLocaleTimeString()}`,
      content,
      parent: parentHash,
      parents,
      timestamp: Date.now()
    }

    list.push(hash, commit.message, content, parentHash)
    array.prepend(commit)
    branchGraph.addCommit(hash, commit.message, parents)
    
    // Set active branch pointer to new commit
    branchGraph.branches.set(currentBranchName, hash)
    const node = branchGraph.nodes.get(hash)
    if (node) {
      node.branches = node.branches ?? []
      node.branches.push(currentBranchName)
    }

    // Remove currentBranchName tag from parent node if it exists
    if (parentHash) {
      const parentNode = branchGraph.nodes.get(parentHash)
      if (parentNode && parentNode.branches) {
        parentNode.branches = parentNode.branches.filter(b => b !== currentBranchName)
      }
    }

    await StorageEngine.saveCommit(id, commit)

    res.json({
      commit,
      dsa: {
        linkedList: list.toArray(),
        array:      array.getVisualizerState(),
        graph:      branchGraph.getVisualizerState()
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getCommits(req, res) {
  try {
    const { id } = req.params
    const { list, array, branchGraph } = await getNoteState(id)
    res.json({
      commits: list.toArray(),
      dsa: {
        linkedList: list.toArray(),
        array:      array.getVisualizerState(),
        graph:      branchGraph.getVisualizerState()
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function restoreCommit(req, res) {
  try {
    const { id, hash } = req.params
    const { list, branchGraph } = await getNoteState(id)
    const content = list.restoreTo(hash)

    // Restore moves current branch HEAD to this commit
    const meta = await StorageEngine.getNote(id)
    const currentBranchName = meta.currentBranch ?? 'main'
    
    const prevHeadHash = branchGraph.branches.get(currentBranchName)
    if (prevHeadHash) {
      const prevNode = branchGraph.nodes.get(prevHeadHash)
      if (prevNode && prevNode.branches) {
        prevNode.branches = prevNode.branches.filter(b => b !== currentBranchName)
      }
    }

    branchGraph.branches.set(currentBranchName, hash)
    const activeNode = branchGraph.nodes.get(hash)
    if (activeNode) {
      activeNode.branches = activeNode.branches ?? []
      if (!activeNode.branches.includes(currentBranchName)) {
        activeNode.branches.push(currentBranchName)
      }
    }

    meta.branches = meta.branches ?? {}
    meta.branches[currentBranchName] = hash
    if (meta.pendingMerge) {
      delete meta.pendingMerge
    }
    await StorageEngine.saveNoteMeta(id, meta)

    res.json({ content, restoredHash: hash })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function diffCommits(req, res) {
  try {
    const { id } = req.params
    const { fromHash, toHash } = req.query
    const { list } = await getNoteState(id)

    const fromNode = list.findByHash(fromHash)
    const toNode   = list.findByHash(toHash)

    if (!fromNode || !toNode) return res.status(404).json({ error: 'Commit not found' })

    const diff = computeDiff(fromNode.content, toNode.content)
    res.json({ diff, from: fromHash, to: toHash })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getSingleCommit(req, res) {
  try {
    const { id, hash } = req.params
    console.log(`[API] getSingleCommit - noteId: ${id}, hash: ${hash}`)
    const { list } = await getNoteState(id)
    console.log(`[API] LinkedList head for note ${id} is:`, list.head ? list.head.hash : 'null')
    const node = list.findByHash(hash)
    if (!node) {
      console.log(`[API] Commit ${hash} NOT found in LinkedList!`)
      return res.status(404).json({ error: 'Commit not found' })
    }
    console.log(`[API] Commit ${hash} successfully found. Content size: ${node.content.length}`)
    res.json({ commit: node })
  } catch (error) {
    console.error('[API] Error in getSingleCommit:', error)
    res.status(500).json({ error: error.message })
  }
}

// Line-level diff (Myers algorithm simplified)
function computeDiff(oldText, newText) {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const result   = []

  const maxLen = Math.max(oldLines.length, newLines.length)
  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i]
    const n = newLines[i]
    if (o === n)        result.push({ type: 'unchanged', content: o ?? '' })
    else if (o == null) result.push({ type: 'added',     content: n })
    else if (n == null) result.push({ type: 'removed',   content: o })
    else {
      result.push({ type: 'removed', content: o })
      result.push({ type: 'added',   content: n })
    }
  }
  return result
}
