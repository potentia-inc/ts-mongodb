import assert from 'node:assert'
import {
  BulkWriteOptions,
  Collection as MongoCollection,
  DeleteOptions,
  Document,
  Filter,
  FindOneAndUpdateOptions,
  FindOptions,
  InsertOneOptions,
  OptionalId,
  OptionalUnlessRequiredId,
  Sort,
  UpdateFilter,
  UpdateOptions,
} from 'mongodb'
import { ConflictError, NotFoundError, UnacknowledgedError } from './error.js'
import { Connection, isDuplicationError } from './connection.js'
import { Cache, Options as CacheOptions } from './cache.js'
import { ObjectId, UUID, toObjectId, toUUID } from './type.js'
import { isNil } from './util.js'
export {
  BulkWriteOptions,
  DeleteOptions,
  Document,
  Filter,
  FindOneAndUpdateOptions,
  FindOptions,
  InsertOneOptions,
  OptionalId,
  OptionalUnlessRequiredId,
  Sort,
  UpdateFilter,
  UpdateOptions,
} from 'mongodb'

export type CollectionOptions = {
  connection: Connection
  name: string
  cache?: CacheOptions
}

export abstract class BaseCollection<Doc extends Document> {
  name: string
  connection: Connection
  cache?: Cache<Doc>

  get collection(): MongoCollection<Doc> {
    return this.connection.db.collection<Doc>(this.name)
  }

  constructor(options: CollectionOptions) {
    this.connection = options.connection
    this.name = options.name
    if (options.cache !== undefined) this.cache = new Cache<Doc>(options.cache)
  }

  abstract generate(id?: Doc['_id']): Doc['_id']

  async cacheOne(id: Doc['_id'], options: FindOptions = {}): Promise<Doc> {
    const key = String(id)
    const cached = this.cache?.get(key)
    if (!isNil(cached)) return cached
    const doc = await this.findOne(id, options)
    this.cache?.set(key, doc)
    return doc
  }

  async findOne(id: Doc['_id'], options: FindOptions = {}): Promise<Doc> {
    const doc = await this.collection.findOne({ _id: id }, options)
    if (doc === null) throw new NotFoundError(`Not Found: ${this.name}`)
    return doc as Doc
  }

  async queryOne(
    filter: Filter<Doc>,
    options: FindOptions = {},
  ): Promise<Doc | undefined> {
    const doc = await this.collection.findOne(filter, options)
    return doc === null ? undefined : (doc as Doc)
  }

  async queryMany(
    filter: Filter<Doc>,
    sort: Sort = {},
    options: FindOptions = {},
  ): Promise<Doc[]> {
    return (await this.collection
      .find(filter, options)
      .sort(sort)
      .toArray()) as Doc[]
  }

  async insertOne(
    doc: OptionalId<Doc>,
    options: InsertOneOptions = {},
  ): Promise<Doc> {
    try {
      const generated = { ...doc, _id: this.generate(doc._id as Doc['_id'] | undefined) }
      const { acknowledged } = await this.collection.insertOne(
        generated as OptionalUnlessRequiredId<Doc>,
        options,
      )
      if (acknowledged) return generated as Doc
    } catch (err) {
      throw isDuplicationError(err)
        ? new ConflictError(`Conflict: ${this.name}`)
        : err
    }
    throw new UnacknowledgedError()
  }

  async insertMany(
    docs: OptionalId<Doc>[],
    options: BulkWriteOptions = {},
  ): Promise<Doc[]> {
    if (docs.length === 0) return []
    try {
      const generated = docs.map((x) => ({ ...x, _id: this.generate(x._id as Doc['_id'] | undefined) }))
      const { acknowledged } = await this.collection.insertMany(
        generated as OptionalUnlessRequiredId<Doc>[],
        options,
      )
      if (acknowledged) return generated as Doc[]
    } catch (err) {
      throw isDuplicationError(err)
        ? new ConflictError(`Conflict: ${this.name}`)
        : err
    }
    throw new UnacknowledgedError()
  }

  async updateOne(
    id: Doc['_id'],
    values: UpdateFilter<Doc>,
    options: FindOneAndUpdateOptions = {},
  ): Promise<Doc> {
    const updated = await this.collection.findOneAndUpdate(
      { _id: id },
      values,
      { returnDocument: 'after', ...options },
    )
    if (updated !== null) return updated as Doc
    throw new NotFoundError(`Not Found: ${this.name}`)
  }

  async updateMany(
    filter: Filter<Doc>,
    update: UpdateFilter<Doc>,
    options: UpdateOptions = {},
  ): Promise<number> {
    const { modifiedCount } = await this.collection.updateMany(
      filter,
      update,
      options,
    )
    return modifiedCount
  }

  async deleteOne(id: Doc['_id'], options: DeleteOptions = {}): Promise<void> {
    const { deletedCount } = await this.collection.deleteOne(
      { _id: id },
      options,
    )
    if (deletedCount !== 1) throw new NotFoundError(`Not Found: ${this.name}`)
  }

  async deleteMany(
    filter: Filter<Doc>,
    options: DeleteOptions = {},
  ): Promise<number> {
    const { deletedCount } = await this.collection.deleteMany(filter, options)
    return deletedCount
  }
}

export class Collection<Doc extends Document> extends BaseCollection<Doc> {
  generate(id?: Doc['_id']): Doc['_id'] {
    assert(id !== undefined)
    return id
  }
}

export class UUIDCollection<
  Doc extends Document & { _id: UUID },
> extends BaseCollection<Doc> {
  generate(id?: UUID): UUID {
    return id ?? toUUID()
  }
}

export class ObjectIdCollection<
  Doc extends Document & { _id: ObjectId },
> extends BaseCollection<Doc> {
  generate(id?: ObjectId): ObjectId {
    return id ?? toObjectId()
  }
}
