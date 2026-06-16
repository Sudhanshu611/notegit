// backend/controllers/branches.controller.js
import { StorageEngine } from '../storage/StorageEngine.js'
import { getNoteState } from './commits.controller.js'
import crypto from 'crypto'

export async function getBranches(req, res) {
  try {
    const { noteId } = req.params
    const { branchGraph } = await getNoteState(noteId)
    
    res.json({
      branches: Array.from(branchGraph.branches.keys()),
      activeBranch: branchGraph.HEAD,
      dsa: {
        graph: branchGraph.getVisualizerState()
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function createBranch(req, res) {
  try {
    const { noteId } = req.params
    const { name, fromHash } = req.body

    if (!name) return res.status(400).json({ error: 'Branch name is required' })

    const { branchGraph } = await getNoteState(noteId)
    
    // Default fromHash to current branch HEAD if not provided
    const targetHash = fromHash || branchGraph.branches.get(branchGraph.HEAD)

    if (!targetHash) {
      return res.status(400).json({ error: 'Cannot branch from empty history' })
    }

    branchGraph.createBranch(name, targetHash)

    // Save to meta.json
    const meta = await StorageEngine.getNote(noteId)
    meta.branches = meta.branches ?? {}
    meta.branches[name] = targetHash
    await StorageEngine.saveNoteMeta(noteId, meta)

    res.json({
      success: true,
      branches: Array.from(branchGraph.branches.keys()),
      dsa: {
        graph: branchGraph.getVisualizerState()
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function switchBranch(req, res) {
  try {
    const { noteId } = req.params
    const { name } = req.body

    if (!name) return res.status(400).json({ error: 'Branch name is required' })

    const { list, branchGraph } = await getNoteState(noteId)
    
    const headHash = branchGraph.switchBranch(name)

    // Update currentBranch in meta.json
    const meta = await StorageEngine.getNote(noteId)
    meta.currentBranch = name
    await StorageEngine.saveNoteMeta(noteId, meta)

    // Fetch the note content at this HEAD hash
    let content = ''
    if (headHash) {
      const commitNode = list.findByHash(headHash)
      if (commitNode) content = commitNode.content
    }

    res.json({
      success: true,
      activeBranch: name,
      headHash,
      content,
      dsa: {
        graph: branchGraph.getVisualizerState()
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function mergeBranches(req, res) {
  try {
    const { noteId } = req.params
    const { sourceBranch, targetBranch } = req.body

    const { list, branchGraph, array } = await getNoteState(noteId)
    
    const target = targetBranch || branchGraph.HEAD
    const { sourceHead, targetHead, ancestor } = branchGraph.merge(sourceBranch, target)

    if (!sourceHead) return res.status(404).json({ error: `Source branch ${sourceBranch} HEAD not found` })
    if (!targetHead) return res.status(404).json({ error: `Target branch ${target} HEAD not found` })

    const sourceContent = list.restoreTo(sourceHead)
    const targetContent = list.restoreTo(targetHead)
    const ancestorContent = ancestor ? list.restoreTo(ancestor) : ''

    const { mergedContent, hasConflicts } = performThreeWayMerge(
      ancestorContent,
      targetContent,
      sourceContent,
      target,
      sourceBranch
    )

    if (hasConflicts) {
      // Return the content containing conflicts so the user can resolve them in the editor
      return res.json({
        success: false,
        conflicts: true,
        content: mergedContent,
        message: `Merge conflict in ${target} from ${sourceBranch}`
      })
    }

    // Auto-create a merge commit
    const mergeHash = crypto.createHash('sha1')
                            .update(mergedContent + Date.now())
                            .digest('hex')
                            .slice(0, 7)

    const commitMessage = `Merge branch '${sourceBranch}' into ${target}`
    
    const commit = {
      hash: mergeHash,
      message: commitMessage,
      content: mergedContent,
      parent: targetHead, // In our simplified LinkedList we point next to targetHead
      timestamp: Date.now()
    }

    list.push(mergeHash, commitMessage, mergedContent, targetHead)
    array.prepend(commit)

    // Update graph nodes to include merge commit
    branchGraph.addCommit(mergeHash, commitMessage, [targetHead, sourceHead])
    branchGraph.branches.set(target, mergeHash)
    
    const node = branchGraph.nodes.get(mergeHash)
    if (node) {
      node.branches = node.branches ?? []
      node.branches.push(target)
    }

    // Remove branch tags from parents
    const targetParent = branchGraph.nodes.get(targetHead)
    if (targetParent && targetParent.branches) {
      targetParent.branches = targetParent.branches.filter(b => b !== target)
    }

    // Save commit
    await StorageEngine.saveCommit(noteId, commit)

    // Update branches in meta.json
    const meta = await StorageEngine.getNote(noteId)
    meta.branches = meta.branches ?? {}
    meta.branches[target] = mergeHash
    await StorageEngine.saveNoteMeta(noteId, meta)

    res.json({
      success: true,
      conflicts: false,
      content: mergedContent,
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

// Helper: 3-way line merge
function performThreeWayMerge(baseText, targetText, sourceText, targetName, sourceName) {
  const baseLines = baseText.split('\n')
  const targetLines = targetText.split('\n')
  const sourceLines = sourceText.split('\n')

  const merged = []
  let hasConflicts = false

  const maxLines = Math.max(baseLines.length, targetLines.length, sourceLines.length)

  for (let i = 0; i < maxLines; i++) {
    const b = baseLines[i]
    const t = targetLines[i]
    const s = sourceLines[i]

    if (t === s) {
      // Both made the same change or didn't change
      if (t !== undefined) merged.push(t)
    } else if (t === b) {
      // Target didn't change, source did. Keep source.
      if (s !== undefined) merged.push(s)
    } else if (s === b) {
      // Source didn't change, target did. Keep target.
      if (t !== undefined) merged.push(t)
    } else {
      // Both changed to different things. Conflict!
      hasConflicts = true
      merged.push(`<<<<<<< ${targetName}`)
      if (t !== undefined) merged.push(t)
      merged.push('=======')
      if (s !== undefined) merged.push(s)
      merged.push(`>>>>>>> ${sourceName}`)
    }
  }

  return {
    mergedContent: merged.join('\n'),
    hasConflicts
  }
}
