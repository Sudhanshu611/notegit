#ifndef UNDO_REDO_MANAGER_HPP
#define UNDO_REDO_MANAGER_HPP

#include "Stack.hpp"
#include <string>
#include <vector>

namespace dsa {

// I built this coordinator class to manage our dual stacks (undoStack and redoStack).
// It maps directly to keyboard hotkeys (Ctrl+Z / Ctrl+Y) in our front-end editor.
class UndoRedoManager {
public:
    Stack<std::string> undoStack;
    Stack<std::string> redoStack;

    UndoRedoManager() : undoStack(50), redoStack(50) {}

    // Call on every content change. I check that the user actually typed something new
    // before pushing to undoStack. Creating a new state resets the redoStack timeline.
    void recordChange(const std::string& snapshot) {
        std::string currentTop = undoStack.peek();
        if (currentTop.empty() || currentTop != snapshot) {
            undoStack.push(snapshot);
            redoStack.clear(); // new change invalidates redo history
        }
    }

    // Triggered on Ctrl+Z. Pops current content onto redoStack, loads previous content.
    std::string undo(const std::string& currentContent) {
        if (undoStack.isEmpty()) return currentContent;

        std::string top = undoStack.peek();
        if (!top.empty() && top == currentContent) {
            std::string popped = undoStack.pop();
            redoStack.push(popped);
        } else {
            // User had unsaved keystrokes since last debounce; baseline them into Redo first.
            redoStack.push(currentContent);
        }

        std::string newTop = undoStack.peek();
        return !newTop.empty() ? newTop : "";
    }

    // Triggered on Ctrl+Y. Moves state from redoStack back onto undoStack.
    std::string redo(const std::string& currentContent) {
        if (redoStack.isEmpty()) return currentContent;

        std::string next = redoStack.pop();
        undoStack.push(next);
        return next;
    }
};

} // namespace dsa

#endif
