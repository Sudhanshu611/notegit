import { runCpp, hexEncode, hexDecode } from './runnerHelper.js'

export class CommitArray {
  constructor() {
    this.state_str = 'EMPTY'
    this.items = []
  }

  _sync() {
    if (this.state_str === 'EMPTY' || !this.state_str) {
      this.items = []
      return
    }
    const commits = this.state_str.split(';')
    // State is stored oldest first, but array.items is newest first. So we reverse it!
    this.items = commits.map(c => {
      const parts = c.split(':')
      return {
        hash:    parts[0],
        message: hexDecode(parts[1])
      }
    }).reverse()
  }

  prepend(commit) {
    const { newState } = runCpp('array', 'prepend', this.state_str, [
      commit.hash,
      hexEncode(commit.message)
    ])
    this.state_str = newState
    this._sync()
  }

  getAtIndex(i) {
    const { result } = runCpp('array', 'getAtIndex', this.state_str, [i.toString()])
    if (!result) return null
    const parts = result.split(':')
    return {
      hash:    parts[0],
      message: hexDecode(parts[1])
    }
  }

  clear() {
    this.state_str = 'EMPTY'
    this.items = []
  }

  getVisualizerState() {
    const { result } = runCpp('array', 'getVisualizerState', this.state_str)
    if (!result) return { commits: [], headIndex: 0, total: 0 }
    
    const parts = result.split('|')
    const total = Number(parts[1])
    const commitsPart = parts[0]
    
    const commits = commitsPart ? commitsPart.split(';').map(c => {
      const nodeParts = c.split('~')
      return {
        index:   Number(nodeParts[0]),
        hash:    nodeParts[1],
        message: hexDecode(nodeParts[2])
      }
    }) : []

    return {
      commits,
      headIndex: 0,
      total
    }
  }
}
