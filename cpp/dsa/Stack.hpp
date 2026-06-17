#ifndef STACK_HPP
#define STACK_HPP

#include <vector>
#include <algorithm>

namespace dsa {

// I decided to implement a generic class template here, so we can store any type (e.g. strings for snapshots).
// It has a maximum depth (50) to limit memory growth: if we exceed it, it discards the oldest item
// from the bottom of the stack (index 0 in vector).
template <typename T>
class Stack {
private:
    std::vector<T> items;
    size_t maxSize;

public:
    Stack(size_t maxSize = 50) : maxSize(maxSize) {}

    // O(1) amortized. When the stack reaches capacity, we delete the first element (the bottom of the stack)
    // which costs O(n) due to vector element shifting, but under normal pushes it takes constant time.
    void push(const T& item) {
        if (items.size() >= maxSize) {
            items.erase(items.begin()); // evict oldest (bottom of stack)
        }
        items.push_back(item);
    }

    // O(1) - pop the top frame off the stack.
    T pop() {
        if (isEmpty()) {
            return T();
        }
        T topItem = items.back();
        items.pop_back();
        return topItem;
    }

    // O(1) - peek at the top frame without removing it.
    T peek() const {
        if (isEmpty()) {
            return T();
        }
        return items.back();
    }

    bool isEmpty() const {
        return items.empty();
    }

    size_t size() const {
        return items.size();
    }

    // Slice and return the top N frames.
    // This is passed back to React to display active cards in the stack visualizer columns.
    std::vector<T> topFrames(size_t n) const {
        std::vector<T> frames;
        size_t count = std::min(n, items.size());
        for (size_t i = 0; i < count; ++i) {
            frames.push_back(items[items.size() - 1 - i]);
        }
        return frames; // [top, ..., bottom]
    }

    void clear() {
        items.clear();
    }

    // Expose the raw items container so the C++ runner can serialize the whole state
    const std::vector<T>& getItems() const {
        return items;
    }
};

} // namespace dsa

#endif
