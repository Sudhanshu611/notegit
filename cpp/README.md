# 📓 NoteGit - C++ DSA Implementations

This folder contains the C++ translations of NoteGit's custom Data Structures and Algorithms (DSA) used to manage git-style snapshots, undo/redo history, note indexing, and merge operations.

These C++ headers and demo files allow academic demonstration (e.g. for explanation to a professor) without modifying or disrupting the live web application (React + Node.js/Express).

## 🗺️ DSA Mapping Overview

| C++ Class | Source Location | Purpose | Data Structure |
|---|---|---|---|
| [`CommitNode`](dsa/CommitNode.hpp) | `dsa/CommitNode.hpp` | Represents a single commit snapshot | Struct Node |
| [`CommitLinkedList`](dsa/CommitLinkedList.hpp) | `dsa/CommitLinkedList.hpp` | Handles sequential commit history lists | Singly Linked List |
| [`Stack`](dsa/Stack.hpp) | `dsa/Stack.hpp` | Template stack with eviction threshold | Eviction Stack |
| [`UndoRedoManager`](dsa/UndoRedoManager.hpp) | `dsa/UndoRedoManager.hpp` | Manages dual state stack tracking | Stack Orchestrator |
| [`HashMap`](dsa/HashMap.hpp) | `dsa/HashMap.hpp` | Hashed note title indexes using djb2 | Bucket-Chained Hash Map |
| [`CommitArray`](dsa/CommitArray.hpp) | `dsa/CommitArray.hpp` | Flat indexed index list of commits | Array |
| [`BranchGraph`](dsa/BranchGraph.hpp) | `dsa/BranchGraph.hpp` | Graph DAG for branch trees and ancestor BFS | Directed Acyclic Graph (DAG) |

## 🚀 Compilation & Running

The simulation runner in `main.cpp` executes scenarios on all 5 custom structures.

To compile and execute using a standard C++17 compiler (e.g. GCC/g++):

```bash
# 1. Compile the demo suite
g++ -std=c++17 -I dsa main.cpp -o demo

# 2. Run the executable
./demo
```
