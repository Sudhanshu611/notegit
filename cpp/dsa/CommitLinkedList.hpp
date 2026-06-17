#ifndef COMMIT_LINKED_LIST_HPP
#define COMMIT_LINKED_LIST_HPP

#include "CommitNode.hpp"
#include <vector>
#include <string>
#include <stdexcept>

namespace dsa {

// I built this linked list class to model our NoteGit commit timeline.
// Pushing new snapshots prepends them at the head, keeping the timeline ordered newest-first.
class CommitLinkedList {
public:
    CommitNode* head; // most recent commit (HEAD)
    int size;

    CommitLinkedList() : head(nullptr), size(0) {}

    // Destructor to clean up all dynamically allocated memory.
    // I crawl the list and delete each node to prevent memory leaks on the server side.
    ~CommitLinkedList() {
        CommitNode* current = head;
        while (current != nullptr) {
            CommitNode* nextNode = current->next;
            delete current;
            current = nextNode;
        }
    }

    // O(1) - prepend new commit. Since it's a stack-like linked list,
    // inserting at index 0 takes constant time. I invoke this when a user commits.
    CommitNode* push(std::string hash, std::string message, std::string content, std::string parentHash) {
        CommitNode* node = new CommitNode(hash, message, content, parentHash);
        node->next = head;
        head = node;
        size++;
        return node;
    }

    // O(n) - walk list to find a commit by hash.
    // Called when checking individual commit details or running file diffs.
    CommitNode* findByHash(std::string hash) {
        CommitNode* current = head;
        while (current != nullptr) {
            if (current->hash == hash) {
                return current;
            }
            current = current->next;
        }
        return nullptr;
    }

    struct CommitSummary {
        std::string hash;
        std::string message;
        std::string parent;
        long long timestamp;
    };

    // O(n) - serialize to a flat list structure.
    // This feeds the React visualizer. The visualizer matches this array state
    // to render the chain of green SVG pills on the sidebar.
    std::vector<CommitSummary> toArray() {
        std::vector<CommitSummary> result;
        CommitNode* current = head;
        while (current != nullptr) {
            result.push_back({current->hash, current->message, current->parent, current->timestamp});
            current = current->next;
        }
        return result; // index 0 = HEAD
    }

    // O(n) - restore note content to a specific commit.
    // Triggered when a user clicks the 'Restore' button in the timeline.
    std::string restoreTo(std::string hash) {
        CommitNode* node = findByHash(hash);
        if (node == nullptr) {
            throw std::invalid_argument("Commit " + hash + " not found");
        }
        return node->content;
    }
};

} // namespace dsa

#endif
