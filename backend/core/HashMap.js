// core/HashMap.js
export class HashMap {
  constructor(buckets = 8) {
    this.buckets  = new Array(buckets).fill(null).map(() => [])
    this.size     = 0
    this.capacity = buckets
  }

  // djb2 hash function
  _hash(key) {
    let hash = 5381
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) + hash) + key.charCodeAt(i)
      hash = hash & hash  // convert to 32-bit int
    }
    return Math.abs(hash) % this.capacity
  }

  // O(1) average — store noteId by note title
  set(key, value) {
    const index  = this._hash(key)
    const bucket = this.buckets[index]
    const existing = bucket.find(([k]) => k === key)

    if (existing) {
      existing[1] = value
    } else {
      bucket.push([key, value])
      this.size++

      // Resize if load factor > 0.75
      if (this.size / this.capacity > 0.75) this._resize()
    }

    return { slot: index, key, value }  // returned to visualizer
  }

  // O(1) average
  get(key) {
    const index  = this._hash(key)
    const bucket = this.buckets[index]
    const pair   = bucket.find(([k]) => k === key)
    return pair ? pair[1] : null
  }

  // O(1) average
  delete(key) {
    const index  = this._hash(key)
    const bucket = this.buckets[index]
    const i      = bucket.findIndex(([k]) => k === key)
    if (i > -1) {
      bucket.splice(i, 1)
      this.size--
    }
  }

  _resize() {
    const old         = this.buckets
    this.capacity    *= 2
    this.buckets      = new Array(this.capacity).fill(null).map(() => [])
    this.size         = 0
    old.forEach(bucket => bucket.forEach(([k, v]) => this.set(k, v)))
  }

  // Shape sent to HashMapViz
  getVisualizerState() {
    return {
      buckets:  this.buckets.map((b, i) => ({
        index: i,
        entries: b.map(([k]) => k),
        filled: b.length > 0
      })),
      capacity: this.capacity,
      size:     this.size
    }
  }
}
