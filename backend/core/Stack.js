import { runCpp, hexEncode, hexDecode } from './runnerHelper.js'

export class Stack {
  constructor(maxSize = 50) {
    this.maxSize = maxSize
  }
}

export class UndoRedoManager {
  constructor() {
    this.state_str = '|' // represents empty undoStack and empty redoStack
  }

  recordChange(snapshot) {
    const { newState } = runCpp('stack', 'recordChange', this.state_str, [
      hexEncode(snapshot)
    ])
    this.state_str = newState
  }

  undo(currentContent) {
    const { newState, result } = runCpp('stack', 'undo', this.state_str, [
      hexEncode(currentContent)
    ])
    this.state_str = newState
    return hexDecode(result)
  }

  redo(currentContent) {
    const { newState, result } = runCpp('stack', 'redo', this.state_str, [
      hexEncode(currentContent)
    ])
    this.state_str = newState
    return hexDecode(result)
  }

  getVisualizerState() {
    const { result } = runCpp('stack', 'getVisualizerState', this.state_str)
    if (!result) return { undoStack: [], redoStack: [] }
    const parts = result.split('|')
    const undoStack = parts[0] ? parts[0].split(',').map(hexDecode) : []
    const redoStack = parts[1] ? parts[1].split(',').map(hexDecode) : []
    return { undoStack, redoStack }
  }
}
