// core/Stack.js
export class Stack {
  constructor(maxSize = 50) {
    this.items   = []
    this.maxSize = maxSize
  }

  // O(1)
  push(item) {
    if (this.items.length >= this.maxSize) {
      this.items.shift()   // evict oldest (bottom of stack)
    }
    this.items.push(item)
  }

  // O(1)
  pop() {
    if (this.isEmpty()) return null
    return this.items.pop()
  }

  // O(1)
  peek() {
    return this.items[this.items.length - 1] ?? null
  }

  isEmpty()  { return this.items.length === 0 }
  size()     { return this.items.length }

  // Returns top N frames for StackViz
  topFrames(n = 5) {
    return this.items.slice(-n).reverse()  // [top, ..., bottom]
  }

  clear() { this.items = [] }
}

// Usage in editor
export class UndoRedoManager {
  constructor() {
    this.undoStack = new Stack()
    this.redoStack = new Stack()
  }

  // Call on every content change
  recordChange(snapshot) {
    // Only push if the snapshot is different from the current top of the stack
    const currentTop = this.undoStack.peek()
    if (currentTop !== snapshot) {
      this.undoStack.push(snapshot)
      this.redoStack.clear()         // new change invalidates redo history
    }
  }

  undo(currentContent) {
    if (this.undoStack.isEmpty()) return currentContent
    
    // If currentContent is at the top of the stack, pop it since it's the state we are leaving
    if (this.undoStack.peek() === currentContent) {
      const popped = this.undoStack.pop()
      this.redoStack.push(popped)
    } else {
      // Otherwise, user has unsaved typing. Push it to Redo before loading the undo top.
      this.redoStack.push(currentContent)
    }
    
    return this.undoStack.peek() ?? ''
  }

  redo(currentContent) {
    if (this.redoStack.isEmpty()) return currentContent
    
    const next = this.redoStack.pop()
    this.undoStack.push(next)
    return next
  }

  // Shape sent to StackViz
  getVisualizerState() {
    return {
      undoStack: this.undoStack.topFrames(5),
      redoStack: this.redoStack.topFrames(5)
    }
  }
}
