// core/BranchGraph.js
export class BranchGraph {
  constructor() {
    this.nodes    = new Map()   // hash → { hash, message, parents[], branches[], children[] }
    this.branches = new Map()   // branchName → headHash
    this.HEAD     = 'main'
  }

  addCommit(hash, message, parentHashes = []) {
    this.nodes.set(hash, {
      hash,
      message,
      parents:  parentHashes,
      branches: [],
      children: []
    })
    // back-link from parent → child
    parentHashes.forEach(p => {
      if (this.nodes.has(p)) {
        const parent = this.nodes.get(p)
        parent.children = parent.children ?? []
        parent.children.push(hash)
      }
    })
  }

  createBranch(name, fromHash) {
    if (this.branches.has(name)) throw new Error(`Branch "${name}" already exists`)
    this.branches.set(name, fromHash)
    const node = this.nodes.get(fromHash)
    if (node) {
      node.branches = node.branches ?? []
      node.branches.push(name)
    }
  }

  switchBranch(name) {
    if (!this.branches.has(name)) throw new Error(`Branch "${name}" not found`)
    this.HEAD = name
    return this.branches.get(name)  // returns HEAD hash of that branch
  }

  // Three-way merge: finds common ancestor, applies changes
  merge(sourceBranch, targetBranch = this.HEAD) {
    const sourceHead = this.branches.get(sourceBranch)
    const targetHead = this.branches.get(targetBranch)
    const ancestor   = this._findCommonAncestor(sourceHead, targetHead)
    return { sourceHead, targetHead, ancestor }
  }

  _findCommonAncestor(hashA, hashB) {
    if (!hashA || !hashB) return null
    const visitedA = new Set()
    const queueA   = [hashA]
    while (queueA.length) {
      const h = queueA.shift()
      if (!h) continue
      visitedA.add(h)
      const node = this.nodes.get(h)
      if (node && node.parents) node.parents.forEach(p => queueA.push(p))
    }
    const queueB = [hashB]
    while (queueB.length) {
      const h = queueB.shift()
      if (!h) continue
      if (visitedA.has(h)) return h
      const node = this.nodes.get(h)
      if (node && node.parents) node.parents.forEach(p => queueB.push(p))
    }
    return null
  }

  // Shape sent to GraphViz
  getVisualizerState() {
    const nodeList = Array.from(this.nodes.values()).map(n => ({
      id:       n.hash,
      label:    n.hash.slice(0, 7),
      branches: n.branches || [],
      parents:  n.parents || []
    }))

    const edgeList = []
    this.nodes.forEach(n => {
      if (n.parents) {
        n.parents.forEach(p => edgeList.push({ from: p, to: n.hash }))
      }
    })

    return {
      nodes:          nodeList,
      edges:          edgeList,
      branches:       Object.fromEntries(this.branches),
      activeBranch:   this.HEAD
    }
  }
}
