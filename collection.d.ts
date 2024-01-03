import { BulkWriteOptions, Collection as MongoCollection, DeleteOptions, Document, Filter, FindOneAndUpdateOptions, FindOptions, InsertOneOptions, OptionalId, Sort, UpdateFilter, UpdateOptions } from 'mongodb';
import { Connection } from './connection.js';
import { Cache, Options as CacheOptions } from './cache.js';
import { ObjectId, UUID } from './type.js';
export { BulkWriteOptions, DeleteOptions, Document, Filter, FindOneAndUpdateOptions, FindOptions, InsertOneOptions, OptionalId, OptionalUnlessRequiredId, Sort, UpdateFilter, UpdateOptions, } from 'mongodb';
export type CollectionOptions = {
    connection: Connection;
    name: string;
    cache?: CacheOptions;
};
export declare abstract class BaseCollection<Doc extends Document> {
    name: string;
    connection: Connection;
    cache?: Cache<Doc>;
    get collection(): MongoCollection<Doc>;
    constructor(options: CollectionOptions);
    abstract generate(id?: Doc['_id']): Doc['_id'];
    cacheOne(id: Doc['_id'], options?: FindOptions): Promise<Doc>;
    findOne(id: Doc['_id'], options?: FindOptions): Promise<Doc>;
    queryOne(filter: Filter<Doc>, options?: FindOptions): Promise<Doc | undefined>;
    queryMany(filter: Filter<Doc>, sort?: Sort, options?: FindOptions): Promise<Doc[]>;
    insertOne(doc: OptionalId<Doc>, options?: InsertOneOptions): Promise<Doc>;
    insertMany(docs: OptionalId<Doc>[], options?: BulkWriteOptions): Promise<Doc[]>;
    updateOne(id: Doc['_id'], values: UpdateFilter<Doc>, options?: FindOneAndUpdateOptions): Promise<Doc>;
    updateMany(filter: Filter<Doc>, update: UpdateFilter<Doc>, options?: UpdateOptions): Promise<number>;
    deleteOne(id: Doc['_id'], options?: DeleteOptions): Promise<void>;
    deleteMany(filter: Filter<Doc>, options?: DeleteOptions): Promise<number>;
}
export declare class Collection<Doc extends Document> extends BaseCollection<Doc> {
    generate(id?: Doc['_id']): Doc['_id'];
}
export declare class UUIDCollection<Doc extends Document & {
    _id: UUID;
}> extends BaseCollection<Doc> {
    generate(id?: UUID): UUID;
}
export declare class ObjectIdCollection<Doc extends Document & {
    _id: ObjectId;
}> extends BaseCollection<Doc> {
    generate(id?: ObjectId): ObjectId;
}
