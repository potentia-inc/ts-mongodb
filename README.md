# @potentia/mongodb

Utilities for [mongodb](https://github.com/mongodb/node-mongodb-native)

 - [types](#types): utilities for `Binary`, `Decimal128`, `UUID` and `ObjectId`
 - [jest matchers](#jest-matchers): [jest](https://jestjs.io) matchers for types
 - [connection](#connection): `MongoClient` wrapper for connection management
 - [collection](#collection): `Collection` wrapper for CRUD operaitons

Note: [bignumber.js](https://github.com/MikeMcl/bignumber.js) is required for
jest matcher

### Types

Utilities for `Binary`, `Decimal128`, `UUID` and `ObjectId`

```typescript
import {
  toBinary,
  toBinaryOrNil,
  toDecimal128,
  toDecimal128OrNil,
  toObjectId,
  toObjectIdOrNil,
  toUUID,
  toUUIDOrNil,
} from '@potentia/mongodb'
// or import { toBinary, ... } from '@potentia/mongodb/type'

toBinary('foobar') // create a new Binary from the given string
toBinary(Buffer.from('foobar', 'base64')) // create a new Binary from the given Buffer
toBianryOrNil() // undefined

toDecimal128('123.45') // 123.45
toDecimal128('123.45') // 123.45
toDecimal128(Infinity)) // infinity
toDecimal128(-Infinity)) // -infinity
toDecimal128(NaN) // NaN
toDecimal128('foobar') // Error thrown
toDecimal128() // Error thrown
toDecimal128OrNil() // undefined

const uuid = 'f4653fea-ef09-4e84-b3c8-9bc66d99b5bb'
toUUID() // generate a new UUID
toUUID(uuid) // create a new UUID from the given string representation
toUUID('foobar') // Error thrown
toUUIDOrNil() // undefined

const objectid = '658cd87dcad575d87adc87bc'
toObjectId() // generate a new ObjectId
toObjectId(objectid) // create a new ObjectId from the given string representation
toObjectId('foobar') // Error thrown
toObjectIdOrNil() // undefined
```

## Jest matchers

[jest](https://jestjs.io) matchers for `Binary`, `Decimal128`, `UUID` and
`ObjectId`

```typescript
import * as matchers from '@potentia/bignumber/jest'
expect.extend(matchers)

expect(toBinary('foobar')).toBeBinary()
expect('foobar').not.toBeBinary()
expect(toBinary('foobar')).toEqualBinary('foobar')
expect(toBinary('foobar')).toEqualBinary(Buffer.from('foobar', 'base64'))

expect(toDecimal128('123.45')).toBeDecimal128()
expect(toDecimal128('123.45')).toEqualDecimal128(123.45)
expect(toDecimal128('123.45')).toEqualDecimal128('123.45')
expect(toDecimal128(Infinity)).toEqualDecimal128(Infinity)
expect(toDecimal128(-Infinity)).toEqualDecimal128(-Infinity)
expect(toDecimal128(NaN)).not.toEqualDecimal128(NaN)
expect(toDecimal128(NaN)).toBeDecimal128NaN()

const uuid = toUUID()
expect(uuid).toBeUUID()
expect('foobar').not.toBeUUID()
expect(uuid).toEqualUUID(uuid)
expect(uuid).not.toEqualUUID(toUUID())

const objectId = toObjectId()
expect(objectId).toBeObjectId()
expect('foobar').not.toBeObjectId()
expect(objectId).toEqualObjectId(objectid)
expect(objectId).not.toEqualObjectId(toObjectId())
```

### Connection

`MongoClient` wrapper for connection management

```typescript
import { Connection } from '@potentia/mongodb'
// or import { Connection } from '@potentia/mongodb/connection'

const connection = new Connection(
  'mongodb://...',
  { /* other MongoClient options */ },
)
await connection.connect() // connect to the mongodb
await connection.disconnect() // disconnect to the mongodb
connection.client // get the mongodb MongoClient object
connection.db // get the mongodb Db object
await connection.transaction(async (options) => {
  // db operaitons here
})
await connection.migrate({
  name: 'collections',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      additionalProperties: false,
      required: ['_id', 'key'],
      properties: {
        _id: { type: 'binData' },
        key: { type: 'string' },
        value: { type: 'number' },
      },
    },
  },
  indexes: {
    key_unique: { keys: { key: 1 }, options: { unique: true } },
    value_index: { keys: { value: 1 } },
  },
})
```

### Collection

`Collection` wrapper for CRUD operaitons

```typescript
import { Connection, UUID, toUUID } from '@potentia/mongodb'
import { Collection, generateUUID } from '@potentia/mongodb'
// or import { Collection, generateUUID } from '@potentia/mongodb/collection'

// a connection can be shared for all collections
const connection = new Connection('mongodb://...')
await connection.connect()

// example for _id is of type number
type Foo = {
  _id: number
  key: string
  value?: number
}
const foos = new Collection<Foo>({
  name: 'foos', // mongodb collection name
  connection,
  cache: { // optional cache options
    capacity: 100, // cache at most 100 items
    ttl: 60000, // time-to-live in milliseconds for cached items
  },
})
foos.collection // get the mongodb Collection object
// insert a new doc, the _id should be specified explicitly
await foos.insertOne({ _id: 0, key: 'foo0', value: 234 })
await foos.insertMany([
  { _id: 1, key: 'foo1', value: 345 },
  { _id: 2, key: 'foo2', value: 456 },
  ...
])
await foos.findOne(toUUID('...')) // find a doc by id
await foos.cacheOne(toUUID('...')) // find a cached doc by id if possible
await foos.queryOne({ key: 'foo' }) // query a doc
await foos.queryMany({ value: 234 }, { key: 1 }) // query docs sorted by key
await foos.updateOne(toUUID('...'), { $set: { value: 456 } }) // update a doc by id
await foos.updateMany({ value: 456 }, { $set: { value: 789 } }) // update docs
await foos.deleteOne(toUUID('...')) // delete a doc by id
await foos.deleteMany({ value: 789 }) // delete docs


// example for _id is of type UUID
type Bar = {
  _id: UUID
  key: string
  value?: number
}
const bars = new Collection<Bar>({
  name: 'bars',
  connection,
  generate: generateUUID, // generate a new UUID _id if necessary
})
await bars.insertOne({
  key: 'foo',
  value: 234,
}) // a new UUID _id is generated automatically
await bars.insertOne({
  _id: toUUID(),
  key: 'bar',
  value: 345,
}) // the specified _id is used

// generateObjectId() is also provided to generate a new ObjectId _id

await connection.disconnect()
```
