#ifndef COMMIT_NODE_HPP
#define COMMIT_NODE_HPP

#include <string>
#include <chrono>

namespace dsa {

// This struct represents a single commit (snapshot) in our version history linked list.
// I'm using a 7-character hex hash as a unique ID for each commit (similar to how Git does it).
// The parent hash is used to point backwards in the DAG, while the next pointer lets us
// traverse the list from the HEAD downwards.
struct CommitNode {
    std::string hash;       // 7-character hex identifier
    std::string message;
    std::string content;    // full note text at this commit
    std::string parent;     // parent hash (empty if none)
    long long timestamp;
    std::string branch;     // set when node is on a named branch
    CommitNode* next;

    // Standard constructor when creating a brand new commit (computes current system time)
    CommitNode(std::string h, std::string msg, std::string cnt, std::string p)
        : hash(h), message(msg), content(cnt), parent(p), branch(""), next(nullptr) {
        timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count();
    }

    // Constructor override for rehydrating historical commits from the database/file state
    CommitNode(std::string h, std::string msg, std::string cnt, std::string p, long long ts)
        : hash(h), message(msg), content(cnt), parent(p), timestamp(ts), branch(""), next(nullptr) {}
};

} // namespace dsa

#endif
