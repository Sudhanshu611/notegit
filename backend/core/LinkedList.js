// core/LinkedList.js
export class CommitNode {
  constructor(hash, message, content, parentHash = null, timestamp = Date.now()) {
    this.hash      = hash         // 7-char hex
    this.message   = message
    this.content   = content      // full note text at this commit
    this.parent    = parentHash   // null for root commit
    this.timestamp = timestamp
    this.branch    = null         // set when node is on a named branch
    this.next      = null
  }
}

export class CommitLinkedList {
  constructor() {
    this.head = null   // most recent commit
    this.size = 0
  }

  // O(1) — prepend new commit
  push(hash, message, content, parentHash) {
    const node = new CommitNode(hash, message, content, parentHash)
    node.next  = this.head
    this.head  = node
    this.size++
    return node
  }

  // O(n) — walk list to find a commit by hash
  findByHash(hash) {
    let current = this.head
    while (current) {
      if (current.hash === hash) return current
      current = current.next
    }
    return null
  }

  // O(n) — serialize to array for API responses and ArrayViz
  toArray() {
    const result = []
    let current  = this.head
    while (current) {
      result.push({
        hash:      current.hash,
        message:   current.message,
        parent:    current.parent,
        timestamp: current.timestamp
      })
      current = current.next
    }
    return result  // index 0 = HEAD
  }

  // O(n) — restore note content to a specific commit
  restoreTo(hash) {
    const node = this.findByHash(hash)
    if (!node) throw new Error(`Commit ${hash} not found`)
    return node.content
  }
}
