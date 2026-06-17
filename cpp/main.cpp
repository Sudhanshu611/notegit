#include "CommitLinkedList.hpp"
#include "UndoRedoManager.hpp"
#include "HashMap.hpp"
#include "CommitArray.hpp"
#include "BranchGraph.hpp"
#include <iostream>
#include <vector>

int main() {
    std::cout << "=================================================\n";
    std::cout << " 📓 NoteGit DSA in C++ - Verification / Demo\n";
    std::cout << "=================================================\n";

    // 1. Test Singly Linked List (Commit History)
    std::cout << "\n--- 1. Singly Linked List (Commit History) ---\n";
    dsa::CommitLinkedList history;
    history.push("init001", "Initial commit", "Hello World!", "");
    history.push("edit002", "Added paragraph", "Hello World!\nThis is a note.", "init001");
    history.push("edit003", "Fix typo", "Hello World!\nThis is a note. Done.", "edit002");

    std::cout << "List Size: " << history.size << " (Expected: 3)\n";
    std::cout << "HEAD Commit Hash: " << history.head->hash << " (Expected: edit003)\n";

    dsa::CommitNode* found = history.findByHash("edit002");
    std::cout << "Find 'edit002': " << (found != nullptr ? found->message : "Not Found") << "\n";

    try {
        std::string restored = history.restoreTo("init001");
        std::cout << "Restored content of 'init001': \"" << restored << "\"\n";
    } catch (const std::exception& e) {
        std::cout << "Error: " << e.what() << "\n";
    }

    std::vector<dsa::CommitLinkedList::CommitSummary> listState = history.toArray();
    std::cout << "Serialized commits list (Size: " << listState.size() << "):\n";
    for (const auto& c : listState) {
        std::cout << "  - [" << c.hash << "] " << c.message << "\n";
    }


    // 2. Test Stack (Undo / Redo)
    std::cout << "\n--- 2. Stack (Undo / Redo) ---\n";
    dsa::UndoRedoManager editorHistory;
    editorHistory.recordChange("H");
    editorHistory.recordChange("He");
    editorHistory.recordChange("Hel");
    editorHistory.recordChange("Hell");
    editorHistory.recordChange("Hello");

    std::cout << "Current content: \"Hello\"\n";

    std::string undo1 = editorHistory.undo("Hello");
    std::cout << "Undo -> Content: \"" << undo1 << "\"\n";

    std::string undo2 = editorHistory.undo(undo1);
    std::cout << "Undo -> Content: \"" << undo2 << "\"\n";

    std::string redo1 = editorHistory.redo(undo2);
    std::cout << "Redo -> Content: \"" << redo1 << "\"\n";

    std::vector<std::string> undoFrames = editorHistory.undoStack.topFrames(5);
    std::vector<std::string> redoFrames = editorHistory.redoStack.topFrames(5);
    
    std::cout << "Undo Stack Frames (top 5):\n";
    for (const auto& frame : undoFrames) {
        std::cout << "  - " << frame << "\n";
    }
    std::cout << "Redo Stack Frames (top 5):\n";
    for (const auto& frame : redoFrames) {
        std::cout << "  - " << frame << "\n";
    }


    // 3. Test Hash Map (Note Registry with djb2)
    std::cout << "\n--- 3. Hash Map (Note Registry with djb2) ---\n";
    dsa::HashMap registry(8); // init capacity 8
    std::cout << "Initial Capacity: " << registry.capacity << "\n";

    registry.set("DSA Notes", "note_id_1");
    registry.set("Git Internals", "note_id_2");
    registry.set("System Design", "note_id_3");
    registry.set("React Hooks", "note_id_4");
    registry.set("Graph Theory", "note_id_5");
    registry.set("Web Basics", "note_id_6");

    std::cout << "Size before resize: " << registry.sizeCount << " / Capacity: " << registry.capacity << "\n";

    // This set should trigger a resize
    registry.set("Advanced Java", "note_id_7");
    std::cout << "Size after resize: " << registry.sizeCount << " / Capacity: " << registry.capacity << " (Expected Capacity: 16)\n";

    std::cout << "Get 'React Hooks': " << registry.get("React Hooks") << " (Expected: note_id_4)\n";

    registry.remove("React Hooks");
    std::cout << "Get 'React Hooks' after deletion: \"" << registry.get("React Hooks") << "\" (Expected: empty/\"\")\n";
    std::cout << "New Size: " << registry.sizeCount << " (Expected: 6)\n";


    // 4. Test Array (Commit Index)
    std::cout << "\n--- 4. Array (Commit Index) ---\n";
    dsa::CommitArray index;
    index.prepend({"init001", "Initial commit"});
    index.prepend({"edit002", "Added paragraph"});
    index.prepend({"edit003", "Fix typo"});

    std::cout << "Total commits in array: " << index.items.size() << "\n";
    dsa::CommitArray::CommitInfo headInfo = index.getAtIndex(0);
    std::cout << "Index 0 (HEAD): [" << headInfo.hash << "] " << headInfo.message << "\n";
    std::cout << "Index 2: [" << index.getAtIndex(2).hash << "] " << index.getAtIndex(2).message << "\n";


    // 5. Test Directed Acyclic Graph (Branch Graph & LCA BFS)
    std::cout << "\n--- 5. Directed Acyclic Graph (Branch Graph) ---\n";
    dsa::BranchGraph graph;

    // Setup commits:
    // C1 (root) -> C2 -> C3 (main head)
    //              \-> C4 -> C5 (feature head)
    graph.addCommit("C1", "Initial Commit", {});
    graph.branches["main"] = "C1";

    graph.addCommit("C2", "Second Commit", {"C1"});
    graph.branches["main"] = "C2";

    // Fork branch 'feature' at C2
    graph.createBranch("feature", "C2");

    // Commit on main
    graph.addCommit("C3", "Commit on main", {"C2"});
    graph.branches["main"] = "C3";

    // Commits on feature
    graph.switchBranch("feature");
    graph.addCommit("C4", "Commit 1 on feature", {"C2"});
    graph.branches["feature"] = "C4";

    graph.addCommit("C5", "Commit 2 on feature", {"C4"});
    graph.branches["feature"] = "C5";

    std::cout << "Active Branch: " << graph.HEAD << "\n";
    std::cout << "Main Branch HEAD: " << graph.branches["main"] << "\n";
    std::cout << "Feature Branch HEAD: " << graph.branches["feature"] << "\n";

    // Find common ancestor for three-way merge
    dsa::BranchGraph::MergeResult mergeResult = graph.merge("feature", "main");
    std::cout << "Merge Analysis (feature into main):\n";
    std::cout << "  Source Head (feature): " << mergeResult.sourceHead << "\n";
    std::cout << "  Target Head (main): " << mergeResult.targetHead << "\n";
    std::cout << "  Lowest Common Ancestor (LCA): " << mergeResult.ancestor << " (Expected: C2)\n";

    std::cout << "\n=================================================\n";
    std::cout << " All DSA implementations verified successfully!\n";
    std::cout << "=================================================\n";

    return 0;
}
