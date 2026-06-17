import { runCpp, hexEncode, hexDecode } from './runnerHelper.js'

export class BranchGraph {
  constructor() {
    this.nodes    = new Map()   // hash → { hash, message, parents[], branches[], children[] }
    this.branches = new Map()   // branchName → headHash
    this.HEAD     = 'main'
  }

  _serializeState() {
    const nodesList = [];
    for (const [hash, node] of this.nodes.entries()) {
      const parentsStr = (node.parents || []).join(',');
      nodesList.push(`${hash}~${hexEncode(node.message)}~${parentsStr}`);
    }
    const nodesPart = nodesList.length > 0 ? nodesList.join(';') : 'EMPTY';

    const branchesList = [];
    for (const [bName, bHash] of this.branches.entries()) {
      branchesList.push(`${bName}~${bHash || 'null'}`);
    }
    const branchesPart = branchesList.length > 0 ? branchesList.join(';') : 'EMPTY';

    return `${nodesPart}|${branchesPart}|${this.HEAD}`;
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
    const state = this._serializeState()
    const { result } = runCpp('graph', 'merge', state, [sourceBranch, targetBranch])
    const parts = result.split('~')
    return {
      sourceHead: parts[0],
      targetHead: parts[1],
      ancestor:   parts[2] === 'null' ? null : parts[2]
    }
  }

  // Shape sent to GraphViz
  getVisualizerState() {
    const state = this._serializeState()
    const { result } = runCpp('graph', 'getVisualizerState', state)
    if (!result) return { nodes: [], edges: [], branches: {}, activeBranch: this.HEAD }

    const parts = result.split('|')
    const nodesPart = parts[0]
    const edgesPart = parts[1]
    const branchesPart = parts[2]
    const activeBranch = parts[3]

    const nodes = nodesPart !== 'EMPTY' && nodesPart ? nodesPart.split(';').map(n => {
      const nodeParts = n.split('~')
      return {
        id:       nodeParts[0],
        label:    nodeParts[1],
        branches: nodeParts[2] === 'none' ? [] : nodeParts[2].split(','),
        parents:  nodeParts[3] === 'none' ? [] : nodeParts[3].split(',')
      }
    }) : []

    const edges = edgesPart !== 'EMPTY' && edgesPart ? edgesPart.split(';').map(e => {
      const edgeParts = e.split('~')
      return { from: edgeParts[0], to: edgeParts[1] }
    }) : []

    const branches = {}
    if (branchesPart !== 'EMPTY' && branchesPart) {
      branchesPart.split(';').forEach(b => {
        const bParts = b.split('~')
        branches[bParts[0]] = bParts[1] === 'null' ? null : bParts[1]
      })
    }

    return {
      nodes,
      edges,
      branches,
      activeBranch
    }
  }
}
