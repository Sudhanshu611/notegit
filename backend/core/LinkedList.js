import { runCpp, hexEncode, hexDecode } from './runnerHelper.js'

export class CommitNode {
  constructor(hash, message, content, parentHash = null, timestamp = Date.now()) {
    this.hash      = hash
    this.message   = message
    this.content   = content
    this.parent    = parentHash === 'null' ? null : parentHash
    this.timestamp = Number(timestamp)
    this.branch    = null
    this.next      = null
  }
}

export class CommitLinkedList {
  constructor() {
    this.state_str = 'EMPTY'
    this.head = null
    this.size = 0
  }

  _sync() {
    if (this.state_str === 'EMPTY' || !this.state_str) {
      this.head = null
      this.size = 0
      return
    }
    const commits = this.state_str.split(';')
    this.size = commits.length
    
    // The last commit in the string is the head (newest)
    const headParts = commits[commits.length - 1].split(':')
    if (headParts.length >= 5) {
      this.head = new CommitNode(
        headParts[0],
        hexDecode(headParts[1]),
        hexDecode(headParts[2]),
        headParts[3],
        headParts[4]
      )
    } else {
      this.head = null
    }
  }

  push(hash, message, content, parentHash) {
    const parent = parentHash || 'null'
    const { newState } = runCpp('list', 'push', this.state_str, [
      hash,
      hexEncode(message),
      hexEncode(content),
      parent
    ])
    this.state_str = newState
    this._sync()
    return this.head
  }

  findByHash(hash) {
    const { result } = runCpp('list', 'findByHash', this.state_str, [hash])
    if (result === 'NULL' || !result) return null
    const parts = result.split(':')
    return new CommitNode(
      parts[0],
      hexDecode(parts[1]),
      hexDecode(parts[2]),
      parts[3],
      parts[4]
    )
  }

  toArray() {
    const { result } = runCpp('list', 'toArray', this.state_str)
    if (!result) return []
    const commits = result.split(';')
    return commits.map(c => {
      const parts = c.split(':')
      return {
        hash:      parts[0],
        message:   hexDecode(parts[1]),
        parent:    parts[2] === 'null' ? null : parts[2],
        timestamp: Number(parts[3])
      }
    })
  }

  restoreTo(hash) {
    const { result } = runCpp('list', 'restoreTo', this.state_str, [hash])
    return hexDecode(result)
  }
}
