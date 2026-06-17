#ifndef BRANCH_GRAPH_HPP
#define BRANCH_GRAPH_HPP

#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stdexcept>
#include <algorithm>

namespace dsa {

// I built this BranchGraph class as a Directed Acyclic Graph (DAG) to represent
// alternate history paths (branches) and merge connections (edges).
class BranchGraph {
public:
    struct GraphNode {
        std::string hash;
        std::string message;
        std::vector<std::string> parents;
        std::vector<std::string> branches;
        std::vector<std::string> children;

        GraphNode() = default;
        GraphNode(std::string h, std::string msg, std::vector<std::string> p)
            : hash(h), message(msg), parents(p) {}
    };

    std::unordered_map<std::string, GraphNode> nodes; // hash -> GraphNode
    std::unordered_map<std::string, std::string> branches; // branchName -> headHash
    std::string HEAD; // active branch name

    BranchGraph() : HEAD("main") {}

    // Adds a commit node to the graph and registers back-links from the parent to child
    // so we can traverse down the graph timeline during topological rendering.
    void addCommit(std::string hash, std::string message, std::vector<std::string> parentHashes = {}) {
        nodes[hash] = GraphNode(hash, message, parentHashes);

        // back-link from parent -> child
        for (const auto& p : parentHashes) {
            if (nodes.find(p) != nodes.end()) {
                nodes[p].children.push_back(hash);
            }
        }
    }

    // Creates a new pointer flag targeting fromHash (which creates a branch fork)
    void createBranch(std::string name, std::string fromHash) {
        if (branches.find(name) != branches.end()) {
            throw std::invalid_argument("Branch \"" + name + "\" already exists");
        }
        branches[name] = fromHash;
        if (nodes.find(fromHash) != nodes.end()) {
            nodes[fromHash].branches.push_back(name);
        }
    }

    // Switches the HEAD reference pointer to target branch
    std::string switchBranch(std::string name) {
        if (branches.find(name) == branches.end()) {
            throw std::invalid_argument("Branch \"" + name + "\" not found");
        }
        HEAD = name;
        return branches[name]; // returns HEAD hash of that branch
    }

    struct MergeResult {
        std::string sourceHead;
        std::string targetHead;
        std::string ancestor;
    };

    // Three-way merge: calculates Lowest Common Ancestor (LCA) using our BFS searcher
    MergeResult merge(std::string sourceBranch, std::string targetBranch) {
        std::string sourceHead = branches[sourceBranch];
        std::string targetHead = branches[targetBranch];
        std::string ancestor = _findCommonAncestor(sourceHead, targetHead);
        return {sourceHead, targetHead, ancestor};
    }

    MergeResult merge(std::string sourceBranch) {
        return merge(sourceBranch, HEAD);
    }

    // BFS parent traversal to find the Lowest Common Ancestor (LCA) of two branches.
    // I crawl up the ancestral line of Branch A using a queue, saving all visited hashes.
    // Then I crawl up Branch B's ancestors; the first common node we intersect is the LCA.
    std::string _findCommonAncestor(std::string hashA, std::string hashB) {
        if (hashA.empty() || hashB.empty()) return "";

        std::unordered_set<std::string> visitedA;
        std::queue<std::string> queueA;
        queueA.push(hashA);

        while (!queueA.empty()) {
            std::string h = queueA.front();
            queueA.pop();
            if (h.empty()) continue;
            visitedA.insert(h);
            if (nodes.find(h) != nodes.end()) {
                for (const auto& p : nodes[h].parents) {
                    queueA.push(p);
                }
            }
        }

        std::queue<std::string> queueB;
        queueB.push(hashB);

        while (!queueB.empty()) {
            std::string h = queueB.front();
            queueB.pop();
            if (h.empty()) continue;
            if (visitedA.find(h) != visitedA.end()) {
                return h; // Common Ancestor intersected!
            }
            if (nodes.find(h) != nodes.end()) {
                for (const auto& p : nodes[h].parents) {
                    queueB.push(p);
                }
            }
        }

        return "";
    }
};

} // namespace dsa

#endif
