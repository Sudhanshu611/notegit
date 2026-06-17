#ifndef COMMIT_ARRAY_HPP
#define COMMIT_ARRAY_HPP

#include <string>
#include <vector>

namespace dsa {

// I created CommitArray to provide an indexed, flat lookup of commits.
// This allows O(1) index-based access which is very helpful when the UI needs to
// render the timeline cells sequentially on screen.
class CommitArray {
public:
    struct CommitInfo {
        std::string hash;
        std::string message;
    };

    std::vector<CommitInfo> items; // items[0] = HEAD (most recent)

    CommitArray() {}

    // O(n) prepend. It inserts the new commit at index 0 (matching the unshift behavior in JS).
    // This pushes existing commits to the right, taking linear time.
    void prepend(const CommitInfo& commit) {
        items.insert(items.begin(), commit); // prepend to index 0
    }

    // O(1) random access by index.
    CommitInfo getAtIndex(size_t i) const {
        if (i >= items.size()) {
            return {"", ""};
        }
        return items[i];
    }

    void clear() {
        items.clear();
    }
};

} // namespace dsa

#endif
