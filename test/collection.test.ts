import assert from 'node:assert'
import {
  BulkWriteOptions,
  Filter,
  FindOneAndUpdateOptions,
  InsertOneOptions,
  UpdateFilter,
  UUIDCollection,
  UpdateOptions,
} from '../src/collection.js'
import { Connection } from '../src/connection.js'
import {
  ConflictError,
  DisconnectedError,
  NotFoundError,
  TransactionError,
} from '../src/error'
import * as matchers from '../src/jest.js'
import { UUID, toUUID } from '../src/type.js'

expect.extend(matchers)

const { MONGO_URI } = process.env
assert(MONGO_URI !== undefined)

type Test = {
  _id: UUID
  value: string
  created_at: Date
  updated_at?: Date
}

class Tests extends UUIDCollection<Test> {
  async insertOne(
    doc: {
      _id?: UUID
      value: string
    },
    options: InsertOneOptions = {},
  ): Promise<Test> {
    return await super.insertOne({ ...doc, created_at: new Date() }, options)
  }

  async insertMany(
    values: { value: string }[],
    options: BulkWriteOptions = {},
  ): Promise<Test[]> {
    const now = new Date()
    const docs = values.map((x) => ({ ...x, created_at: now }))
    return await super.insertMany(docs, options)
  }

  async updateOne(
    id: Test['_id'],
    values: UpdateFilter<Test>,
    options: FindOneAndUpdateOptions = {},
  ): Promise<Test> {
    return await super.updateOne(
      id,
      { ...values, $currentDate: { updated_at: true } },
      { returnDocument: 'after', ...options },
    )
  }

  async updateMany(
    filter: Filter<Test>,
    update: UpdateFilter<Test>,
    options: UpdateOptions = {},
  ): Promise<number> {
    return await super.updateMany(
      filter,
      { ...update, $currentDate: { updated_at: true } },
      options,
    )
  }
}

const schema = {
  name: 'tests',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      additionalProperties: false,
      required: ['_id', 'value', 'created_at'],
      properties: {
        _id: { bsonType: 'binData' },
        value: { type: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
    },
  },
  indexes: { value_index: { keys: { value: 1 } } },
}

beforeAll(async () => {
  const connection = new Connection(MONGO_URI)
  await connection.connect()
  await connection.migrate({
    ...schema,
    indexes: {
      value_index: { keys: { _id: 1, value: 1 }, options: { unique: 1 } },
    },
  })
  await connection.migrate(schema)
  await connection.disconnect()
}, 30000)

describe('collection', () => {
  const connection = new Connection(MONGO_URI)
  const tests = new Tests({
    name: schema.name,
    connection,
  })

  beforeAll(() => connection.connect())
  afterAll(() => connection.disconnect())

  test('transaction()', async () => {
    const value = rand()
    await connection.transaction(async (options) => {
      await tests.insertOne({ value }, options)
      await tests.insertOne({ value }, options)
    })
    expect(await tests.queryMany({ value })).toHaveLength(2)
  })

  test('transaction() with ConflictError thrown', async () => {
    const _id = toUUID()
    const value = rand()
    await expect(
      connection.transaction(async (options) => {
        await tests.insertOne({ _id, value }, options)
        await tests.insertOne({ _id, value }, options)
      }),
    ).rejects.toThrow(ConflictError)
    expect(await tests.queryMany({ value })).toHaveLength(0)
  })

  test('transaction() with TransactionError thrown', async () => {
    const value = rand()
    await expect(
      connection.transaction(async (options) => {
        await tests.insertOne({ _id: toUUID(), value }, options)
        await tests.insertOne({ _id: toUUID(), value }, options)
        throw new TransactionError()
      }),
    ).rejects.toThrow(TransactionError)
    expect(await tests.queryMany({ value })).toHaveLength(0)
  })

  test('insertOne()', async () => {
    const value = rand()
    const doc = await tests.insertOne({ value })
    expect(doc._id).toBeUUID()
    expect(doc.value).toBe(value)
    expect(doc.created_at).toBeInstanceOf(Date)
    expect(Date.now() - doc.created_at.getTime() < 1000).toBeTruthy()
    expect(doc.updated_at).toBeUndefined()
  })

  test('insertOne() with validation error thrown', async () => {
    await expect(
      tests.insertOne({ value: 123 as unknown as string }),
    ).rejects.toThrow(/Document failed validation/) // MongoServerError
  })

  test('insertOne() with ConflictError thrown', async () => {
    const _id = toUUID()
    await tests.insertOne({ _id, value: rand() })
    await expect(tests.insertOne({ _id, value: rand() })).rejects.toThrow(
      ConflictError,
    )
  })

  test('insertMany()', async () => {
    const value = rand()
    const docs = await tests.insertMany([{ value }, { value }])
    for (const doc of docs) {
      expect(doc._id).toBeUUID()
      expect(doc.value).toBe(value)
      expect(doc.created_at).toBeInstanceOf(Date)
      expect(Date.now() - doc.created_at.getTime() < 1000).toBeTruthy()
      expect(doc.updated_at).toBeUndefined()
    }
    expect(docs[0].created_at.getTime()).toBe(docs[1].created_at.getTime())
  })

  test('findOne()', async () => {
    const value = String(toUUID())
    const doc = await tests.insertOne({ value })
    const found = await tests.findOne(doc._id)
    expect(found._id).toEqualUUID(doc._id)
    expect(found.value).toBe(value)
  })

  test('findOne() with NotFound thrown', async () => {
    await expect(tests.findOne(toUUID())).rejects.toThrow(NotFoundError)
  })

  test('queryOne()', async () => {
    const value = String(toUUID())
    const { _id } = await tests.insertOne({ value })
    check(await tests.queryOne({ _id }))
    check(await tests.queryOne({ value }))

    function check(doc?: Test) {
      assert(doc !== undefined)
      expect(doc._id).toEqualUUID(_id)
      expect(doc.value).toBe(value)
    }
  })

  test('queryMany()', async () => {
    const value = String(toUUID())
    const docs = await tests.insertMany([{ value }, { value }])
    const queried = await tests.queryMany({ value })
    expect(docs.length).toBe(queried.length)
    for (let i = 0; i < docs.length; ++i) {
      const d = docs[i]
      const q = queried[i]
      assert(d !== undefined && q !== undefined)
      expect(q._id).toEqualUUID(d._id)
      expect(q.value).toBe(value)
      expect(q.created_at.getTime()).toBe(d.created_at.getTime())
      expect(q.updated_at).toBeUndefined()
    }
  })

  test('updateOne()', async () => {
    const { _id } = await tests.insertOne({ value: rand() })

    const value = rand()
    const updated = await tests.updateOne(_id, { $set: { value } })
    expect(updated._id).toEqualUUID(_id)
    expect(updated.value).toBe(value)
    expect(updated.updated_at).toBeInstanceOf(Date)
    assert(updated.updated_at !== undefined)
    expect(Date.now() - updated.updated_at.getTime() < 1000).toBeTruthy()
  })

  test('updateMany()', async () => {
    const value = rand()
    const docs = await tests.insertMany([{ value }, { value }])

    const value2 = rand()
    const updated = await tests.updateMany(
      { value },
      { $set: { value: value2 } },
    )
    expect(updated).toBe(docs.length)
    for (const doc of docs) {
      const updated = await tests.findOne(doc._id)
      expect(updated._id).toEqualUUID(doc._id)
      expect(updated.value).toBe(value2)
      expect(updated.created_at.getTime()).toBe(doc.created_at.getTime())
      expect(updated.updated_at).toBeInstanceOf(Date)
      assert(updated.updated_at !== undefined)
      expect(Date.now() - updated.updated_at.getTime() < 1000).toBeTruthy()
    }
  })

  test('deleteOne()', async () => {
    const value = rand()
    const { _id } = await tests.insertOne({ value })
    await tests.deleteOne(_id)
    const deleted = await tests.queryOne({ _id })
    expect(deleted).toBeUndefined()
  })

  test('deleteMany()', async () => {
    const value = rand()
    const docs = await tests.insertMany([{ value }, { value }])
    expect(docs).toHaveLength(2)
    await tests.deleteMany({ value })
    const deleted = await tests.queryMany({ value })
    expect(deleted).toHaveLength(0)
  })
})

describe('collection with cache', () => {
  const connection = new Connection(MONGO_URI)
  const tests = new Tests({
    name: schema.name,
    connection,
    cache: { capacity: 10, ttl: 60000 },
  })

  test('cacheOne() with DisconnectedError thrown', async () => {
    await connection.connect()
    const { _id } = await tests.insertOne({ value: rand() })
    await tests.cacheOne(_id) // query db and cache it
    await connection.disconnect()
    await expect(tests.findOne(_id)).rejects.toThrow(DisconnectedError)
  })

  test('cacheOne()', async () => {
    await connection.connect()
    const { _id } = await tests.insertOne({ value: rand() })
    await tests.cacheOne(_id) // query db and cache it
    await connection.disconnect()
    const cached = await tests.cacheOne(_id) // find the doc from cache
    expect(cached._id).toEqualUUID(_id)
  })
})

function rand(): string {
  return String(toUUID())
}
