import assert from 'node:assert'
import type { Decimal128Extended } from 'bson'
import { Binary, Decimal128, ObjectId, UUID } from 'mongodb'
import { isNil } from './util.js'

export { Binary, Decimal128, ObjectId, UUID } from 'mongodb'

const inspect = Symbol.for('nodejs.util.inspect.custom') // for console.log etc

declare module 'mongodb' {
  interface Binary {
    [Symbol.toPrimitive]: (hint: string) => string
    [inspect]: () => string
  }

  interface Decimal128 {
    [Symbol.toPrimitive]: (hint: string) => number | string
    [inspect]: () => string
  }

  interface ObjectId {
    [Symbol.toPrimitive]: (hint: string) => string
    [inspect]: () => string
  }

  interface UUID {
    [Symbol.toPrimitive]: (hint: string) => string
    [inspect]: () => string
  }
}

Binary.prototype[Symbol.toPrimitive] = function (hint: string): string {
  assert(hint !== 'number')
  return this.sub_type === Binary.SUBTYPE_UUID
    ? this.toUUID().toString()
    : this.toJSON() // to base64 encoding
}
Binary.prototype[inspect] = function () {
  return this.sub_type === Binary.SUBTYPE_UUID
    ? `UUID(${this})`
    : `Binary(${this})`
}

Decimal128.prototype[Symbol.toPrimitive] = function (
  hint: string,
): number | string {
  return hint === 'number' ? Number(this.toString()) : this.toString()
}
Decimal128.prototype[inspect] = function () {
  return `Decimal128(${this})`
}
// FIXME hack the Decimal128.prototype.toJSON for JSON.string() to output string
Decimal128.prototype.toJSON = function (): Decimal128Extended {
  return this.toString() as unknown as Decimal128Extended
}

ObjectId.prototype[Symbol.toPrimitive] = function (hint: string): string {
  assert(hint !== 'number')
  return this.toString()
}
ObjectId.prototype[inspect] = function () {
  return `ObjectId(${this})`
}

UUID.prototype[Symbol.toPrimitive] = function (hint: string): string {
  assert(hint !== 'number')
  return this.toString()
}
UUID.prototype[inspect] = function () {
  return `UUID(${this})`
}

const UUID_HEX_RE =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15})$/i

export function toBinary(x: unknown): Binary {
  if (x instanceof Binary) return x
  if (x instanceof UUID) return x.toBinary()
  if (Buffer.isBuffer(x)) return new Binary(x, Binary.SUBTYPE_BYTE_ARRAY)
  if (typeof x === 'string') {
    if (UUID_HEX_RE.test(x)) return toBinary(toUUID(x))
    return toBinary(toBuffer(x))
  }
  return toBinary(String(x))
}

export function toBinaryOrNil(x?: unknown): Binary | undefined {
  return isNil(x) ? undefined : toBinary(x)
}

export const BUFFER_ENCODINGS: BufferEncoding[] = [
  'base64',
  'base64url',
  'hex',
  'utf8',
  'utf-8',
  'utf16le',
  'ucs2',
  'ucs-2',
  'ascii',
  'latin1',
  'binary',
]

export function toBuffer(x: unknown): Buffer {
  if (Buffer.isBuffer(x)) return x
  if (x instanceof Binary) return Buffer.from(x.value())
  if (typeof x === 'string') {
    for (const encoding of BUFFER_ENCODINGS) {
      try {
        return Buffer.from(x, encoding)
      } catch (err) {
        // ignore and try the next encoding
      }
    }
    assert(false, `failed to decode ${x} for toBuffer()`)
  }
  return toBuffer(String(x))
}

export function toBufferOrNil(x?: unknown): Buffer | undefined {
  return isNil(x) ? undefined : toBuffer(x)
}

export function toDecimal128(x: unknown, round: boolean = true): Decimal128 {
  if (x instanceof Decimal128) return x
  return round
    ? Decimal128.fromStringWithRounding(String(x))
    : Decimal128.fromString(String(x))
}

export function toDecimal128OrNil(x?: unknown): Decimal128 | undefined {
  return isNil(x) ? undefined : toDecimal128(x)
}

export function toObjectId(x?: unknown): ObjectId {
  if (x instanceof ObjectId) return x
  if (isNil(x)) return new ObjectId()
  if (Buffer.isBuffer(x) || typeof x === 'number') return new ObjectId(x)
  return new ObjectId(String(x))
}

export function toObjectIdOrNil(x?: unknown): ObjectId | undefined {
  return isNil(x) ? undefined : toObjectId(x)
}

export function toUUID(x?: unknown): UUID {
  if (x instanceof UUID) return x
  if (x instanceof Binary) {
    assert(x.sub_type === Binary.SUBTYPE_UUID)
    return x.toUUID()
  }
  if (isNil(x) || Buffer.isBuffer(x) || typeof x === 'string') {
    return new UUID(x)
  }
  return new UUID(String(x))
}

export function toUUIDOrNil(x?: unknown): UUID | undefined {
  return isNil(x) ? undefined : toUUID(x)
}
