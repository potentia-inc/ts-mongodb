import {
  BUFFER_ENCODINGS,
  toBinary,
  toBinaryOrNil,
  toBuffer,
  toBufferOrNil,
  toDecimal128,
  toDecimal128OrNil,
  toObjectId,
  toObjectIdOrNil,
  toUUID,
  toUUIDOrNil,
} from '../src/type.js'
import * as matchers from '../src/jest.js'

expect.extend(matchers)

describe('Binary', () => {
  test('toBeBinary() and toEqualBinary()', () => {
    const a = toBinary('foobar')
    expect(a).toBeBinary()
    expect('foobar').not.toBeBinary()

    expect(a).toEqualBinary(a)
    expect('foobar').not.toEqualBinary(a)
    expect(a).toEqualBinary(Buffer.from('foobar', 'base64'))
    expect(a).toEqualBinary('foobar')
    expect(a).not.toEqualBinary('foo')
    expect(a).not.toEqualBinary(Buffer.from('bar'))
  })

  test('toBinaryOrNil()', () => {
    expect(toBinaryOrNil(null)).toBeUndefined()
    expect(toBinaryOrNil(undefined)).toBeUndefined()
    expect(toBinaryOrNil('foobar')).toBeBinary()
  })
})

describe('Buffer', () => {
  test('toBuffer() and toEqualBuffer()', () => {
    const a = toBuffer('foobar')
    expect(a).toBeBuffer()
    expect('foobar').not.toBeBuffer()
    for (const encoding of BUFFER_ENCODINGS) {
      expect(toBuffer(a.toString(encoding))).toBeBuffer()
    }

    expect(a).toEqualBuffer(a)
    expect('foobar').not.toEqualBuffer(a)
    expect(a).toEqualBuffer('foobar')
    expect(a).not.toEqualBuffer('foo')
    expect(a).not.toEqualBuffer(Buffer.from('bar'))
  })

  test('toBufferOrNil()', () => {
    expect(toBufferOrNil(null)).toBeUndefined()
    expect(toBufferOrNil(undefined)).toBeUndefined()
    expect(toBufferOrNil('foobar')).toBeBuffer()
  })
})

describe('Decimal128', () => {
  test('toBeDecimal128() and toEqualDecimal128()', () => {
    const a = toDecimal128(123.45)
    expect(a).toBeDecimal128()
    expect('foobar').not.toBeDecimal128()

    expect(a).toEqualDecimal128(a)
    expect('foobar').not.toEqualDecimal128(a)
    expect(a).toEqualDecimal128(123.45)
    expect(a).toEqualDecimal128('123.45')
    expect(a).not.toEqualDecimal128(234.56)
    expect(a).not.toEqualDecimal128('234.56')
    expect(a).not.toBeDecimal128NaN()

    expect(toDecimal128(Infinity)).toEqualDecimal128(Infinity)
    expect(toDecimal128(-Infinity)).toEqualDecimal128(-Infinity)
    expect(toDecimal128(NaN)).not.toEqualDecimal128(NaN)
    expect(toDecimal128(NaN)).toBeDecimal128NaN()
    expect(() => toDecimal128('foobar')).toThrow(/valid/)
  })

  test('toDecimal128OrNil()', () => {
    expect(toDecimal128OrNil(null)).toBeUndefined()
    expect(toDecimal128OrNil(undefined)).toBeUndefined()
    expect(toDecimal128OrNil('1.234')).toBeDecimal128()
  })
})

describe('ObjectId', () => {
  test('toBeObjectId() and toEqualObjectId()', () => {
    const a = toObjectId()
    expect(a).toBeObjectId()
    expect('foobar').not.toBeObjectId()

    expect(a).toEqualObjectId(a)
    expect('foobar').not.toEqualObjectId(a)
    expect(a).toEqualObjectId(a.toString())
    expect(a).not.toEqualObjectId(toObjectId())
    expect(a).not.toEqualObjectId(toObjectId().toString())
  })

  test('toObjectIdOrNil', () => {
    expect(toObjectIdOrNil(null)).toBeUndefined()
    expect(toObjectIdOrNil(undefined)).toBeUndefined()
    expect(toObjectIdOrNil('658e77fb9d2dd4679b004398')).toBeObjectId()
  })
})

describe('UUID', () => {
  test('toBeUUID() and toEqualUUID()', () => {
    const a = toUUID()
    expect(a).toBeUUID()
    expect('foobar').not.toBeUUID()
    expect(toUUID({ toString: () => a.toString() })).toBeUUID()
    expect(toUUID(toUUID().toBinary())).toBeUUID()

    expect(a).toEqualUUID(a)
    expect('foobar').not.toEqualUUID(a)
    expect(a).toEqualUUID(a.toString())
    expect(a).not.toEqualUUID(toUUID())
    expect(a).not.toEqualUUID(toUUID().toString())
  })

  test('toUUIDOrNil()', () => {
    expect(toUUIDOrNil(null)).toBeUndefined()
    expect(toUUIDOrNil(undefined)).toBeUndefined()
    expect(toUUIDOrNil('60456314-8bf5-48a1-b51b-726037a6e8b9')).toBeUUID()
  })
})
