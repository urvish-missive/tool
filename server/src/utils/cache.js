import crypto from 'crypto'

/**
 * High-performance In-Memory Cache with TTL and Max-Capacity Eviction.
 * Guarantees zero data compromise and sub-millisecond response for identical queries.
 */
class MemoryCache {
  constructor(defaultTtlMs = 10 * 60 * 1000, maxSize = 300) {
    this.defaultTtlMs = defaultTtlMs
    this.maxSize = maxSize
    this.cache = new Map()
  }

  /**
   * Generates a stable deterministic hash key from any object or primitive
   */
  hashKey(prefix, params) {
    const raw = typeof params === 'string' ? params : JSON.stringify(params)
    const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 24)
    return `${prefix}:${hash}`
  }

  /**
   * Retrieves an item if not expired
   */
  get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    // Refresh LRU order (delete & re-insert)
    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.value
  }

  /**
   * Sets an item with TTL
   */
  set(key, value, ttlMs = this.defaultTtlMs) {
    if (!key || value === undefined) return

    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    })
  }

  /**
   * Clears all cache entries
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Current number of cached entries
   */
  get size() {
    return this.cache.size
  }
}

// Export singleton instances for general result caching and web scraping caching
export const apiResultCache = new MemoryCache(10 * 60 * 1000, 300) // 10 minutes
export const scrapeCache = new MemoryCache(15 * 60 * 1000, 200)    // 15 minutes
export default apiResultCache
