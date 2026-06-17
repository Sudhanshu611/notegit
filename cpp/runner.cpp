// ============================================================================
// 📓 NoteGit C++ State-Transformer CLI Runner
// 
// I wrote this runner program to act as a bridge between Node.js and our C++ DSA core.
// Since Node.js cannot run C++ headers directly, the Node backend compiles and calls
// this binary via child_process.execFileSync.
// 
// It reads the serialized state of the data structure, action, and arguments,
// re-hydrates the structures in memory, executes the algorithm, and spits out
// the updated serialized state string to stdout so the JS wrapper can capture it.
// 
// Note: String arguments (like contents and commit messages) are hex-encoded in JS
// before passing to prevent spaces, quotes, and newlines from messing up the CLI argv!
// ============================================================================

#include "CommitLinkedList.hpp"
#include "UndoRedoManager.hpp"
#include "HashMap.hpp"
#include "CommitArray.hpp"
#include "BranchGraph.hpp"
#include <iostream>
#include <sstream>
#include <vector>
#include <string>
#include <algorithm>
#include <stdexcept>
#include <queue>
#include <unordered_map>
#include <unordered_set>

// Helper to split a string by delimiter
std::vector<std::string> split(const std::string& str, char delimiter) {
    std::vector<std::string> tokens;
    std::string token;
    std::istringstream tokenStream(str);
    while (std::getline(tokenStream, token, delimiter)) {
        tokens.push_back(token);
    }
    if (str.empty()) return tokens;
    if (str.back() == delimiter) {
        tokens.push_back("");
    }
    return tokens;
}

// Hex decoder
std::string hex_decode(const std::string& hex) {
    std::string decoded;
    for (size_t i = 0; i < hex.length(); i += 2) {
        if (i + 1 >= hex.length()) break;
        std::string byte = hex.substr(i, 2);
        char chr = (char) (int) strtol(byte.c_str(), nullptr, 16);
        decoded.push_back(chr);
    }
    return decoded;
}

// Hex encoder
std::string hex_encode(const std::string& str) {
    std::string encoded;
    static const char hex_digits[] = "0123456789abcdef";
    for (char c : str) {
        encoded.push_back(hex_digits[(c >> 4) & 0x0F]);
        encoded.push_back(hex_digits[c & 0x0F]);
    }
    return encoded;
}

// -------------------------------------------------------------
// 1. CommitLinkedList Serialization & Rehydration
// -------------------------------------------------------------
void rehydrate_list(dsa::CommitLinkedList& list, const std::string& state) {
    if (state == "EMPTY" || state.empty()) return;
    std::vector<std::string> commits = split(state, ';');
    for (const auto& c_str : commits) {
        std::vector<std::string> parts = split(c_str, ':');
        if (parts.size() < 5) continue;
        std::string hash = parts[0];
        std::string hex_message = parts[1];
        std::string hex_content = parts[2];
        std::string parent = parts[3] == "null" ? "" : parts[3];
        long long timestamp = std::stoll(parts[4]);
        
        dsa::CommitNode* node = new dsa::CommitNode(hash, hex_decode(hex_message), hex_decode(hex_content), parent, timestamp);
        node->next = list.head;
        list.head = node;
        list.size++;
    }
}

std::string serialize_list(dsa::CommitLinkedList& list) {
    std::vector<dsa::CommitNode*> nodes;
    dsa::CommitNode* current = list.head;
    while (current != nullptr) {
        nodes.push_back(current);
        current = current->next;
    }
    std::string state;
    for (auto it = nodes.rbegin(); it != nodes.rend(); ++it) {
        if (!state.empty()) state += ";";
        dsa::CommitNode* n = *it;
        state += n->hash + ":" + hex_encode(n->message) + ":" + hex_encode(n->content) + ":" + (n->parent.empty() ? "null" : n->parent) + ":" + std::to_string(n->timestamp);
    }
    return state.empty() ? "EMPTY" : state;
}

// -------------------------------------------------------------
// 2. UndoRedoManager Serialization & Rehydration
// -------------------------------------------------------------
void rehydrate_undo_redo(dsa::UndoRedoManager& manager, const std::string& state) {
    if (state == "EMPTY" || state.empty()) return;
    std::vector<std::string> stacks = split(state, '|');
    if (stacks.size() < 2) return;
    
    if (!stacks[0].empty()) {
        std::vector<std::string> undo_items = split(stacks[0], ',');
        for (const auto& item_hex : undo_items) {
            manager.undoStack.push(hex_decode(item_hex));
        }
    }
    if (!stacks[1].empty()) {
        std::vector<std::string> redo_items = split(stacks[1], ',');
        for (const auto& item_hex : redo_items) {
            manager.redoStack.push(hex_decode(item_hex));
        }
    }
}

std::string serialize_undo_redo(dsa::UndoRedoManager& manager) {
    std::string undo_str;
    for (const auto& item : manager.undoStack.getItems()) {
        if (!undo_str.empty()) undo_str += ",";
        undo_str += hex_encode(item);
    }
    std::string redo_str;
    for (const auto& item : manager.redoStack.getItems()) {
        if (!redo_str.empty()) redo_str += ",";
        redo_str += hex_encode(item);
    }
    return (undo_str.empty() ? "" : undo_str) + "|" + (redo_str.empty() ? "" : redo_str);
}

// -------------------------------------------------------------
// 3. CommitArray Serialization & Rehydration
// -------------------------------------------------------------
void rehydrate_array(dsa::CommitArray& array, const std::string& state) {
    if (state == "EMPTY" || state.empty()) return;
    std::vector<std::string> commits = split(state, ';');
    for (const auto& c_str : commits) {
        std::vector<std::string> parts = split(c_str, ':');
        if (parts.size() < 2) continue;
        array.prepend({parts[0], hex_decode(parts[1])});
    }
}

std::string serialize_array(dsa::CommitArray& array) {
    std::string state;
    for (auto it = array.items.rbegin(); it != array.items.rend(); ++it) {
        if (!state.empty()) state += ";";
        state += it->hash + ":" + hex_encode(it->message);
    }
    return state.empty() ? "EMPTY" : state;
}

// -------------------------------------------------------------
// 4. BranchGraph Serialization & Rehydration
// -------------------------------------------------------------
void rehydrate_graph(dsa::BranchGraph& graph, const std::string& state) {
    if (state == "EMPTY" || state.empty()) return;
    std::vector<std::string> parts = split(state, '|');
    if (parts.size() < 3) return;

    std::string nodes_part = parts[0];
    std::string branches_part = parts[1];
    std::string head_part = parts[2];

    if (nodes_part != "EMPTY" && !nodes_part.empty()) {
        std::vector<std::string> nodes_list = split(nodes_part, ';');
        for (const auto& n_str : nodes_list) {
            std::vector<std::string> node_parts = split(n_str, '~');
            if (node_parts.size() < 2) continue;
            std::string hash = node_parts[0];
            std::string hex_message = node_parts[1];
            std::vector<std::string> parentHashes;
            if (node_parts.size() >= 3 && !node_parts[2].empty()) {
                parentHashes = split(node_parts[2], ',');
            }
            graph.addCommit(hash, hex_decode(hex_message), parentHashes);
        }
    }

    if (branches_part != "EMPTY" && !branches_part.empty()) {
        std::vector<std::string> branches_list = split(branches_part, ';');
        for (const auto& b_str : branches_list) {
            std::vector<std::string> b_parts = split(b_str, '~');
            if (b_parts.size() < 2) continue;
            std::string b_name = b_parts[0];
            std::string b_hash = b_parts[1] == "null" ? "" : b_parts[1];
            graph.branches[b_name] = b_hash;
            
            if (!b_hash.empty() && graph.nodes.find(b_hash) != graph.nodes.end()) {
                graph.nodes[b_hash].branches.push_back(b_name);
            }
        }
    }

    graph.HEAD = head_part;
}

std::string serialize_graph(dsa::BranchGraph& graph) {
    std::unordered_map<std::string, int> in_degree;
    for (const auto& pair : graph.nodes) {
        in_degree[pair.first] = 0;
    }
    for (const auto& pair : graph.nodes) {
        for (const auto& child : pair.second.children) {
            in_degree[child]++;
        }
    }

    std::queue<std::string> q;
    for (const auto& pair : in_degree) {
        if (pair.second == 0) {
            q.push(pair.first);
        }
    }

    std::vector<std::string> ordered_hashes;
    while (!q.empty()) {
        std::string u = q.front();
        q.pop();
        ordered_hashes.push_back(u);

        if (graph.nodes.find(u) != graph.nodes.end()) {
            for (const auto& child : graph.nodes[u].children) {
                in_degree[child]--;
                if (in_degree[child] == 0) {
                    q.push(child);
                }
            }
        }
    }

    if (ordered_hashes.size() < graph.nodes.size()) {
        for (const auto& pair : graph.nodes) {
            if (std::find(ordered_hashes.begin(), ordered_hashes.end(), pair.first) == ordered_hashes.end()) {
                ordered_hashes.push_back(pair.first);
            }
        }
    }

    std::string nodes_str;
    for (const auto& hash : ordered_hashes) {
        if (graph.nodes.find(hash) == graph.nodes.end()) continue;
        if (!nodes_str.empty()) nodes_str += ";";
        const auto& n = graph.nodes[hash];
        std::string parents_str;
        for (size_t i = 0; i < n.parents.size(); ++i) {
            if (i > 0) parents_str += ",";
            parents_str += n.parents[i];
        }
        nodes_str += n.hash + "~" + hex_encode(n.message) + "~" + parents_str;
    }

    std::string branches_str;
    for (const auto& pair : graph.branches) {
        if (!branches_str.empty()) branches_str += ";";
        branches_str += pair.first + "~" + (pair.second.empty() ? "null" : pair.second);
    }

    return (nodes_str.empty() ? "EMPTY" : nodes_str) + "|" + (branches_str.empty() ? "EMPTY" : branches_str) + "|" + graph.HEAD;
}

// -------------------------------------------------------------
// MAIN CLI RUNNER
// -------------------------------------------------------------
int main(int argc, char* argv[]) {
    if (argc < 4) {
        std::cerr << "Usage: runner <structure> <action> <state> [args...]\n";
        return 1;
    }

    std::string structure = argv[1];
    std::string action = argv[2];
    std::string state_str = argv[3];

    // 1. CommitLinkedList
    if (structure == "list") {
        dsa::CommitLinkedList list;
        rehydrate_list(list, state_str);

        if (action == "push") {
            if (argc < 8) return 1;
            std::string hash = argv[4];
            std::string hex_message = argv[5];
            std::string hex_content = argv[6];
            std::string parent = argv[7];
            if (parent == "null") parent = "";

            list.push(hash, hex_decode(hex_message), hex_decode(hex_content), parent);

            std::cout << "STATE:" << serialize_list(list) << "\n";
            std::cout << "RESULT:SUCCESS\n";
        }
        else if (action == "findByHash") {
            if (argc < 5) return 1;
            std::string hash = argv[4];
            dsa::CommitNode* node = list.findByHash(hash);
            if (node == nullptr) {
                std::cout << "RESULT:NULL\n";
            } else {
                std::cout << "RESULT:" << node->hash << ":" << hex_encode(node->message) << ":" << hex_encode(node->content) << ":" << (node->parent.empty() ? "null" : node->parent) << ":" << node->timestamp << "\n";
            }
        }
        else if (action == "toArray") {
            std::vector<dsa::CommitLinkedList::CommitSummary> array = list.toArray();
            std::cout << "RESULT:";
            for (size_t i = 0; i < array.size(); ++i) {
                if (i > 0) std::cout << ";";
                std::cout << array[i].hash << ":" << hex_encode(array[i].message) << ":" << (array[i].parent.empty() ? "null" : array[i].parent) << ":" << array[i].timestamp;
            }
            std::cout << "\n";
        }
        else if (action == "restoreTo") {
            if (argc < 5) return 1;
            std::string hash = argv[4];
            try {
                std::string content = list.restoreTo(hash);
                std::cout << "RESULT:" << hex_encode(content) << "\n";
            } catch (const std::exception& e) {
                std::cout << "ERROR:" << e.what() << "\n";
            }
        }
    }
    // 2. UndoRedoManager
    else if (structure == "stack") {
        dsa::UndoRedoManager manager;
        rehydrate_undo_redo(manager, state_str);

        if (action == "recordChange") {
            if (argc < 5) return 1;
            std::string hex_snapshot = argv[4];
            manager.recordChange(hex_decode(hex_snapshot));

            std::cout << "STATE:" << serialize_undo_redo(manager) << "\n";
            std::cout << "RESULT:SUCCESS\n";
        }
        else if (action == "undo") {
            if (argc < 5) return 1;
            std::string hex_content = argv[4];
            std::string previous = manager.undo(hex_decode(hex_content));

            std::cout << "STATE:" << serialize_undo_redo(manager) << "\n";
            std::cout << "RESULT:" << hex_encode(previous) << "\n";
        }
        else if (action == "redo") {
            if (argc < 5) return 1;
            std::string hex_content = argv[4];
            std::string next = manager.redo(hex_decode(hex_content));

            std::cout << "STATE:" << serialize_undo_redo(manager) << "\n";
            std::cout << "RESULT:" << hex_encode(next) << "\n";
        }
        else if (action == "getVisualizerState") {
            std::vector<std::string> undoFrames = manager.undoStack.topFrames(5);
            std::vector<std::string> redoFrames = manager.redoStack.topFrames(5);

            std::cout << "RESULT:";
            for (size_t i = 0; i < undoFrames.size(); ++i) {
                if (i > 0) std::cout << ",";
                std::cout << hex_encode(undoFrames[i]);
            }
            std::cout << "|";
            for (size_t i = 0; i < redoFrames.size(); ++i) {
                if (i > 0) std::cout << ",";
                std::cout << hex_encode(redoFrames[i]);
            }
            std::cout << "\n";
        }
    }
    // 3. CommitArray
    else if (structure == "array") {
        dsa::CommitArray array;
        rehydrate_array(array, state_str);

        if (action == "prepend") {
            if (argc < 6) return 1;
            std::string hash = argv[4];
            std::string hex_message = argv[5];

            array.prepend({hash, hex_decode(hex_message)});

            std::cout << "STATE:" << serialize_array(array) << "\n";
            std::cout << "RESULT:SUCCESS\n";
        }
        else if (action == "getAtIndex") {
            if (argc < 5) return 1;
            int idx = std::stoi(argv[4]);
            dsa::CommitArray::CommitInfo info = array.getAtIndex(idx);
            std::cout << "RESULT:" << info.hash << ":" << hex_encode(info.message) << "\n";
        }
        else if (action == "getVisualizerState") {
            // Replicates array visualizer state structure
            std::cout << "RESULT:";
            size_t count = std::min((size_t)8, array.items.size());
            for (size_t i = 0; i < count; ++i) {
                if (i > 0) std::cout << ";";
                std::string msg = array.items[i].message;
                if (msg.length() > 24) {
                    msg = msg.substr(0, 24) + "...";
                }
                std::cout << i << "~" << array.items[i].hash << "~" << hex_encode(msg);
            }
            std::cout << "|" << array.items.size() << "\n";
        }
    }
    // 4. BranchGraph
    else if (structure == "graph") {
        dsa::BranchGraph graph;
        rehydrate_graph(graph, state_str);

        if (action == "addCommit") {
            if (argc < 7) return 1;
            std::string hash = argv[4];
            std::string hex_message = argv[5];
            std::string parents_comma = argv[6];
            std::vector<std::string> parents;
            if (parents_comma != "null" && !parents_comma.empty()) {
                parents = split(parents_comma, ',');
            }

            graph.addCommit(hash, hex_decode(hex_message), parents);

            std::cout << "STATE:" << serialize_graph(graph) << "\n";
            std::cout << "RESULT:SUCCESS\n";
        }
        else if (action == "createBranch") {
            if (argc < 6) return 1;
            std::string name = argv[4];
            std::string fromHash = argv[5];

            try {
                graph.createBranch(name, fromHash);
                std::cout << "STATE:" << serialize_graph(graph) << "\n";
                std::cout << "RESULT:SUCCESS\n";
            } catch (const std::exception& e) {
                std::cout << "ERROR:" << e.what() << "\n";
            }
        }
        else if (action == "switchBranch") {
            if (argc < 5) return 1;
            std::string name = argv[4];

            try {
                std::string headHash = graph.switchBranch(name);
                std::cout << "STATE:" << serialize_graph(graph) << "\n";
                std::cout << "RESULT:" << headHash << "\n";
            } catch (const std::exception& e) {
                std::cout << "ERROR:" << e.what() << "\n";
            }
        }
        else if (action == "merge") {
            if (argc < 6) return 1;
            std::string sourceBranch = argv[4];
            std::string targetBranch = argv[5];

            dsa::BranchGraph::MergeResult res = graph.merge(sourceBranch, targetBranch);
            std::cout << "RESULT:" << res.sourceHead << "~" << res.targetHead << "~" << (res.ancestor.empty() ? "null" : res.ancestor) << "\n";
        }
        else if (action == "getVisualizerState") {
            // output: nodes_part|edges_part|branches_part|activeBranch
            // nodes_part: id~label~branches_comma~parents_comma;...
            // edges_part: from~to;...
            // branches_part: branchName~headHash;...
            
            std::string nodes_str;
            for (const auto& pair : graph.nodes) {
                if (!nodes_str.empty()) nodes_str += ";";
                const auto& n = pair.second;
                
                std::string b_str;
                for (size_t i = 0; i < n.branches.size(); ++i) {
                    if (i > 0) b_str += ",";
                    b_str += n.branches[i];
                }
                std::string p_str;
                for (size_t i = 0; i < n.parents.size(); ++i) {
                    if (i > 0) p_str += ",";
                    p_str += n.parents[i];
                }
                
                std::string label = n.hash;
                if (label.length() >= 7) label = label.substr(0, 7);
                
                nodes_str += n.hash + "~" + label + "~" + (b_str.empty() ? "none" : b_str) + "~" + (p_str.empty() ? "none" : p_str);
            }

            std::string edges_str;
            for (const auto& pair : graph.nodes) {
                const auto& n = pair.second;
                for (const auto& p : n.parents) {
                    if (!edges_str.empty()) edges_str += ";";
                    edges_str += p + "~" + n.hash;
                }
            }

            std::string branches_str;
            for (const auto& pair : graph.branches) {
                if (!branches_str.empty()) branches_str += ";";
                branches_str += pair.first + "~" + (pair.second.empty() ? "null" : pair.second);
            }

            std::cout << "RESULT:" << (nodes_str.empty() ? "EMPTY" : nodes_str) << "|" 
                      << (edges_str.empty() ? "EMPTY" : edges_str) << "|"
                      << (branches_str.empty() ? "EMPTY" : branches_str) << "|"
                      << graph.HEAD << "\n";
        }
    }

    return 0;
}
