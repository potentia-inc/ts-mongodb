import assert from 'node:assert';
import { ConflictError, NotFoundError, UnacknowledgedError } from './error.js';
import { isDuplicationError } from './connection.js';
import { Cache } from './cache.js';
import { toObjectId, toUUID } from './type.js';
import { isNil } from './util.js';
export class BaseCollection {
    get collection() {
        return this.connection.db.collection(this.name);
    }
    constructor(options) {
        this.connection = options.connection;
        this.name = options.name;
        if (options.cache !== undefined)
            this.cache = new Cache(options.cache);
    }
    async cacheOne(id, options = {}) {
        const key = String(id);
        const cached = this.cache?.get(key);
        if (!isNil(cached))
            return cached;
        const doc = await this.findOne(id, options);
        this.cache?.set(key, doc);
        return doc;
    }
    async findOne(id, options = {}) {
        const doc = await this.collection.findOne({ _id: id }, options);
        if (doc === null)
            throw new NotFoundError(`Not Found: ${this.name}`);
        return doc;
    }
    async queryOne(filter, options = {}) {
        const doc = await this.collection.findOne(filter, options);
        return doc === null ? undefined : doc;
    }
    async queryMany(filter, sort = {}, options = {}) {
        return (await this.collection
            .find(filter, options)
            .sort(sort)
            .toArray());
    }
    async insertOne(doc, options = {}) {
        try {
            const generated = { ...doc, _id: this.generate(doc._id) };
            const { acknowledged } = await this.collection.insertOne(generated, options);
            if (acknowledged)
                return generated;
        }
        catch (err) {
            throw isDuplicationError(err)
                ? new ConflictError(`Conflict: ${this.name}`)
                : err;
        }
        throw new UnacknowledgedError();
    }
    async insertMany(docs, options = {}) {
        if (docs.length === 0)
            return [];
        try {
            const generated = docs.map((x) => ({ ...x, _id: this.generate(x._id) }));
            const { acknowledged } = await this.collection.insertMany(generated, options);
            if (acknowledged)
                return generated;
        }
        catch (err) {
            throw isDuplicationError(err)
                ? new ConflictError(`Conflict: ${this.name}`)
                : err;
        }
        throw new UnacknowledgedError();
    }
    async updateOne(id, values, options = {}) {
        const updated = await this.collection.findOneAndUpdate({ _id: id }, values, { returnDocument: 'after', ...options });
        if (updated !== null)
            return updated;
        throw new NotFoundError(`Not Found: ${this.name}`);
    }
    async updateMany(filter, update, options = {}) {
        const { modifiedCount } = await this.collection.updateMany(filter, update, options);
        return modifiedCount;
    }
    async deleteOne(id, options = {}) {
        const { deletedCount } = await this.collection.deleteOne({ _id: id }, options);
        if (deletedCount !== 1)
            throw new NotFoundError(`Not Found: ${this.name}`);
    }
    async deleteMany(filter, options = {}) {
        const { deletedCount } = await this.collection.deleteMany(filter, options);
        return deletedCount;
    }
}
export class Collection extends BaseCollection {
    generate(id) {
        assert(id !== undefined);
        return id;
    }
}
export class UUIDCollection extends BaseCollection {
    generate(id) {
        return id ?? toUUID();
    }
}
export class ObjectIdCollection extends BaseCollection {
    generate(id) {
        return id ?? toObjectId();
    }
}
//# sourceMappingURL=collection.js.map