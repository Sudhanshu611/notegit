#ifndef HASH_MAP_HPP
#define HASH_MAP_HPP

#include <string>
#include <vector>
#include <cmath>
#include <algorithm>

namespace dsa {

// I implemented a custom Hash Map to index notes by their title.
// To handle hash collisions, I chose the "Chaining" collision resolution strategy
// where each bucket is represented by a vector of Key-Value Entry structs.
class HashMap {
public:
    struct Entry {
        std::string key;
        std::string value;
    };

    std::vector<std::vector<Entry>> buckets;
    size_t sizeCount;
    size_t capacity;

    HashMap(size_t capacity = 8) : sizeCount(0), capacity(capacity) {
        buckets.resize(capacity);
    }

    // djb2 hash function. It's a really famous non-cryptographic hash function.
    // I start with prime 5381 and iteratively shift bits (hash * 33 + char) to distribute keys evenly.
    size_t _hash(const std::string& key) const {
        unsigned long hash = 5381;
        for (char c : key) {
            hash = ((hash << 5) + hash) + c;
        }
        return hash % capacity;
    }

    struct SetResult {
        size_t slot;
        std::string key;
        std::string value;
    };

    // O(1) average time. Adds/updates an entry in the bucket chain.
    // If the load factor (sizeCount / capacity) exceeds 0.75, I resize it.
    SetResult set(const std::string& key, const std::string& value) {
        size_t index = _hash(key);
        auto& bucket = buckets[index];
        
        for (auto& entry : bucket) {
            if (entry.key == key) {
                entry.value = value;
                return {index, key, value};
            }
        }

        bucket.push_back({key, value});
        sizeCount++;

        // Resize if load factor > 0.75
        if ((double)sizeCount / capacity > 0.75) {
            _resize();
            index = _hash(key);
        }

        return {index, key, value};
    }

    // O(1) average time. Fetches value by traversing bucket chain.
    std::string get(const std::string& key) const {
        size_t index = _hash(key);
        const auto& bucket = buckets[index];
        for (const auto& entry : bucket) {
            if (entry.key == key) {
                return entry.value;
            }
        }
        return "";
    }

    // O(1) average time. Erases entry from vector chain.
    void remove(const std::string& key) {
        size_t index = _hash(key);
        auto& bucket = buckets[index];
        for (auto it = bucket.begin(); it != bucket.end(); ++it) {
            if (it->key == key) {
                bucket.erase(it);
                sizeCount--;
                return;
            }
        }
    }

private:
    // O(n) dynamic resize. Doubles capacity and re-hashes every existing entry
    // to distribute items into the new, larger bucket index space.
    void _resize() {
        auto oldBuckets = buckets;
        capacity *= 2;
        buckets.clear();
        buckets.resize(capacity);
        sizeCount = 0;

        for (const auto& bucket : oldBuckets) {
            for (const auto& entry : bucket) {
                set(entry.key, entry.value);
            }
        }
    }
};

} // namespace dsa

#endif
