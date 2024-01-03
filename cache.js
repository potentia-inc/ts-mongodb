import assert from 'node:assert';
import { isNil } from './util.js';
export class Cache {
    constructor({ ttl, capacity, interval }) {
        this.map = new Map();
        this.list = [];
        assert(ttl > 0 && capacity > 0);
        this.ttl = ttl;
        this.capacity = capacity;
        this.interval = interval ?? 10000;
    }
    set(key, value, time) {
        const now = time ?? new Date();
        this.scrub(now);
        if (this.isFull() && isNil(this.get(key, now)))
            this.evict();
        const expiration = now.valueOf() + this.ttl;
        this.map.set(key, [expiration, value]);
        this.list.push([expiration, key]);
        return this;
    }
    get(key, time) {
        const now = time ?? new Date();
        this.scrub(now);
        const item = this.map.get(key);
        if (!isNil(item)) {
            if (item[0] > now.valueOf())
                return item[1];
            this.map.delete(key); // expire the item
        }
        return undefined;
    }
    isFull() {
        return this.map.size >= this.capacity;
    }
    scrub(time) {
        const now = time ?? new Date();
        const timestamp = now.valueOf();
        if (timestamp - (this.last?.valueOf() ?? 0) < this.interval)
            return;
        let size = 0;
        for (; size < this.list.length; ++size) {
            const item = this.list[size];
            assert(!isNil(item));
            const [expiration, key] = item;
            if (expiration > timestamp)
                break;
            const value = this.map.get(key);
            if (!isNil(value) && value[0] === expiration)
                this.map.delete(key);
        }
        this.list.splice(0, size);
        this.last = now;
    }
    evict() {
        let size = 0;
        for (; this.isFull(); ++size) {
            const item = this.list[size];
            assert(!isNil(item));
            const [expiration, key] = item;
            const value = this.map.get(key);
            if (!isNil(value) && value[0] === expiration)
                this.map.delete(key);
        }
        this.list.splice(0, size);
    }
}
//# sourceMappingURL=cache.js.map