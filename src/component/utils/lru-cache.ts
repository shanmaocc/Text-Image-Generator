/**
 * LRU (Least Recently Used) 缓存实现
 * 提供智能的缓存淘汰策略，优化性能
 */

/**
 * 缓存条目接口
 */
interface CacheEntry<V> {
    value: V;
    timestamp: number;
    hits: number;
}

/**
 * LRU 缓存类
 */
export class LRUCache<K, V> {
    private cache = new Map<K, CacheEntry<V>>();
    private maxSize: number;
    private ttl: number;

    /**
     * 构造函数
     * @param maxSize 最大缓存条目数
     * @param ttl 缓存过期时间（毫秒）
     */
    constructor(maxSize: number = 50, ttl: number = 5 * 60 * 1000) {
        this.maxSize = maxSize;
        this.ttl = ttl;
    }

    /**
     * 设置缓存
     * @param key 缓存键
     * @param value 缓存值
     */
    set(key: K, value: V): void {
        // 如果缓存已满，删除最少使用的条目
        if (this.cache.size >= this.maxSize) {
            const lruKey = this.findLeastRecentlyUsed();
            if (lruKey !== null) {
                this.cache.delete(lruKey);
                logger.debug('LRU 缓存已满，淘汰最少使用的条目');
            }
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            hits: 0,
        });
    }

    /**
     * 获取缓存
     * @param key 缓存键
     * @returns 缓存值或 null
     */
    get(key: K): V | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // 检查是否过期
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            logger.debug('缓存已过期，自动删除');
            return null;
        }

        // 更新访问次数和时间戳（LRU 策略）
        entry.hits++;
        entry.timestamp = Date.now();

        return entry.value;
    }

    /**
     * 检查缓存是否存在
     * @param key 缓存键
     * @returns 是否存在且未过期
     */
    has(key: K): boolean {
        return this.get(key) !== null;
    }

    /**
     * 删除缓存
     * @param key 缓存键
     */
    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    /**
     * 清空所有缓存
     */
    clear(): void {
        this.cache.clear();
        logger.debug('缓存已清空');
    }

    /**
     * 获取缓存大小
     */
    size(): number {
        return this.cache.size;
    }

    /**
     * 查找最少使用的条目
     * @returns 最少使用的键
     */
    private findLeastRecentlyUsed(): K | null {
        let lruKey: K | null = null;
        let oldestTimestamp = Infinity;
        let minHits = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            // 优先淘汰访问次数少的
            if (entry.hits < minHits) {
                minHits = entry.hits;
                oldestTimestamp = entry.timestamp;
                lruKey = key;
            } else if (entry.hits === minHits && entry.timestamp < oldestTimestamp) {
                // 访问次数相同，淘汰时间更早的
                oldestTimestamp = entry.timestamp;
                lruKey = key;
            }
        }

        return lruKey;
    }

    /**
     * 获取缓存统计信息
     */
    getStats(): {
        size: number;
        maxSize: number;
        entries: Array<{ key: K; hits: number; age: number }>;
    } {
        const now = Date.now();
        const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            hits: entry.hits,
            age: now - entry.timestamp,
        }));

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            entries,
        };
    }
}
