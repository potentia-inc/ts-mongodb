var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _Connection_client, _Connection_locking, _Connection_uri, _Connection_options;
import { MongoClient, MongoError, } from 'mongodb';
import { ConflictError, DisconnectedError, TransactionError } from './error.js';
import { sleep } from './util.js';
export class Connection {
    get client() {
        if (__classPrivateFieldGet(this, _Connection_client, "f") === undefined)
            throw new DisconnectedError();
        return __classPrivateFieldGet(this, _Connection_client, "f");
    }
    get db() {
        return this.client.db();
    }
    constructor(uri, options) {
        _Connection_client.set(this, undefined);
        _Connection_locking.set(this, false);
        _Connection_uri.set(this, void 0);
        _Connection_options.set(this, void 0);
        __classPrivateFieldSet(this, _Connection_uri, uri, "f");
        __classPrivateFieldSet(this, _Connection_options, options, "f");
    }
    async connect() {
        while (__classPrivateFieldGet(this, _Connection_client, "f") === undefined && __classPrivateFieldGet(this, _Connection_locking, "f"))
            await sleep(50);
        if (__classPrivateFieldGet(this, _Connection_client, "f") !== undefined)
            return __classPrivateFieldGet(this, _Connection_client, "f");
        __classPrivateFieldSet(this, _Connection_locking, true, "f");
        try {
            __classPrivateFieldSet(this, _Connection_client, await MongoClient.connect(__classPrivateFieldGet(this, _Connection_uri, "f"), __classPrivateFieldGet(this, _Connection_options, "f")), "f");
            ['error', 'timeout', 'parseError'].forEach((event) => {
                __classPrivateFieldGet(this, _Connection_client, "f")?.on(event, (...args) => console.error(`db event ${event}: ${JSON.stringify(args)}`));
            });
            return __classPrivateFieldGet(this, _Connection_client, "f");
        }
        finally {
            __classPrivateFieldSet(this, _Connection_locking, false, "f");
        }
    }
    async disconnect(force = false) {
        while (__classPrivateFieldGet(this, _Connection_client, "f") !== undefined && __classPrivateFieldGet(this, _Connection_locking, "f"))
            await sleep(50);
        if (__classPrivateFieldGet(this, _Connection_client, "f") === undefined)
            return;
        __classPrivateFieldSet(this, _Connection_locking, true, "f");
        try {
            await __classPrivateFieldGet(this, _Connection_client, "f").close(force);
            __classPrivateFieldSet(this, _Connection_client, undefined, "f");
        }
        finally {
            __classPrivateFieldSet(this, _Connection_locking, false, "f");
        }
    }
    async transaction(fn, options = {}) {
        if (options?.session !== undefined)
            return await fn(options);
        const session = this.client.startSession();
        try {
            return await session.withTransaction(async (session) => await fn({ ...options, session }));
        }
        catch (err) {
            if (isDuplicationError(err))
                throw new ConflictError();
            if (isTransactionError(err))
                throw new TransactionError();
            throw err;
        }
        finally {
            await session.endSession();
        }
    }
    async migrate({ name, validator, indexes, }) {
        const collection = await (async () => {
            try {
                return await this.db.createCollection(name);
            }
            catch (err) {
                return this.db.collection(name);
            }
        })();
        // create/update the current index
        for (const name of Object.keys(indexes)) {
            const { keys, options = {} } = indexes[name];
            try {
                // try to create the index
                await collection.createIndex(keys, { name, ...options });
            }
            catch (err) {
                // if fails, drop it and try it again
                console.warn('fail to create index:', err);
                try {
                    await collection.dropIndex(name);
                }
                catch (err) {
                    console.warn('fail to drop index:', err);
                }
                await collection.createIndex(keys, { name, ...options });
            }
        }
        // drop the removed indexes
        const names = (await collection.listIndexes().toArray())
            .map(({ name }) => name)
            .filter((name) => !(name === '_id_' || name in indexes));
        for (const name of names)
            await collection.dropIndex(name);
        // update the validator
        await this.db.command({
            collMod: name,
            validator,
            validationLevel: 'strict',
            validationAction: 'error',
        });
    }
}
_Connection_client = new WeakMap(), _Connection_locking = new WeakMap(), _Connection_uri = new WeakMap(), _Connection_options = new WeakMap();
export function isTransactionError(err) {
    return (err instanceof MongoError &&
        err.errorLabels !== undefined &&
        Array.isArray(err.errorLabels) &&
        err.errorLabels.includes('TransientTransactionError'));
}
export function isDuplicationError(err) {
    return (err instanceof MongoError &&
        err.message.startsWith('E11000 duplicate key error'));
}
//# sourceMappingURL=connection.js.map