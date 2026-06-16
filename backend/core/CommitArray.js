// core/CommitArray.js
export class CommitArray {
  constructor() {
    this.items = []  // items[0] = HEAD (most recent)
  }

  prepend(commit) {
    this.items.unshift(commit)  // new commit goes to index 0
  }

  getAtIndex(i) {
    return this.items[i] ?? null
  }

  clear() {
    this.items = []
  }

  // Shape sent to ArrayViz — first 8 commits visible
  getVisualizerState() {
    return {
      commits:   this.items.slice(0, 8).map((c, i) => ({
        index:   i,
        hash:    c.hash,
        message: c.message.slice(0, 24) + (c.message.length > 24 ? '…' : '')
      })),
      headIndex: 0,
      total:     this.items.length
    }
  }
}
