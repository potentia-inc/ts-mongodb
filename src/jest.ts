/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import BigNumber from 'bignumber.js'
import {
  Binary,
  Decimal128,
  ObjectId,
  UUID,
  toDecimal128,
  toBinary,
  toBuffer,
  toObjectId,
  toUUID,
} from './type.js'
import { matcherHint, printExpected, printReceived } from 'jest-matcher-utils'
import { isNil } from './util.js'

interface CustomMatchers<R = unknown> {
  toBeBinary: (this: unknown) => R
  toEqualBinary: (this: unknown, expected: unknown) => R
  toBeBuffer: (this: unknown) => R
  toEqualBuffer: (this: unknown, expected: unknown) => R
  toBeDecimal128: (this: unknown) => R
  toBeDecimal128NaN: (this: unknown) => R
  toEqualDecimal128: (this: unknown, expected: unknown) => R
  toBeObjectId: (this: unknown) => R
  toEqualObjectId: (this: unknown, expected: unknown) => R
  toBeUUID: (this: unknown) => R
  toEqualUUID: (this: unknown, expected: unknown) => R
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

type This = {
  isNot: boolean
  promise: string
}

export function toBeBinary(
  this: unknown,
  received: unknown,
): jest.CustomMatcherResult {
  const { isNot, promise } = this as unknown as This
  const comment = 'Binary type validity'
  const options = { comment, isNot, promise }
  const pass = received instanceof Binary
  const message = getMessage(
    pass,
    matcherHint('toBeBinary', undefined, undefined, options),
    printReceived(received),
    printExpected('Binary'),
  )
  return { message, pass }
}

export function toEqualBinary(
  this: unknown,
  received: unknown,
  expected: unknown,
): jest.CustomMatcherResult {
  const { isNot, promise } = this as unknown as This
  const comment = 'Binary type and optional value equality'
  const options = { comment, isNot, promise }
  const pass = (() => {
    if (!(received instanceof Binary) || isNil(expected)) return false
    const a = received
    const b = toBinary(expected)
    return (
      a.length() === b.length() &&
      Buffer.from(a.value()).compare(Buffer.from(b.value())) === 0
    )
  })()
  const message = getMessage(
    pass,
    matcherHint('toEqualBinary', undefined, undefined, options),
    printReceived(received),
    printExpected(toBinary(expected)?.toString('base64')),
  )
  return { message, pass }
}

export function toBeDecimal128(
  this: unknown,
  received: unknown,
): jest.CustomMatcherResult {
  const { isNot, promise } = this as unknown as This
  const comment = 'Decimal128 type validity'
  const options = { comment, isNot, promise }
  const pass = received instanceof Decimal128
  const message = getMessage(
    pass,
    matcherHint('toBeDecimal128', undefined, undefined, options),
    printReceived(received),
    printExpected('Decimal128'),
  )
  return { message, pass }
}

export function toEqualDecimal128(
  this: unknown,
  received: unknown,
  expected: unknown,
): jest.CustomMatcherResult {
  const { isNot, promise } = this as unknown as This
  const comment = 'Decimal128 type and optional value equality'
  const options = { comment, isNot, promise }
  const pass = (() => {
    if (!(received instanceof Decimal128) || isNil(expected)) return false
    const a = new BigNumber(received.toString())
    const b = new BigNumber(String(expected))
    return a.eq(b)
  })()
  const message = getMessage(
    pass,
    matcherHint('toEqualDecimal128', undefined, undefined, options),
    printReceived(received),
    printExpected(toDecimal128(expected)?.toString()),
  )
  return { message, pass }
}

export function toBeDecimal128NaN(
  this: unknown,
  received: unknown,
): jest.CustomMatcherResult {
  const { isNot, promise } = this as unknown as This
  const comment = 'Decimal128 NaN equality'
  const options = { comment, isNot, promise }
  const pass =
    received instanceof Decimal128 && new BigNumber(received.toString()).isNaN()
  const message = getMessage(
    pass,
    matcherHint('toBeDecimal128NaN', undefined, undefined, options),
    printReceived(received),
    printExpected(NaN),
  )
  return { message, pass }
}

export function toBeBuffer(
  this: unknown,
  received: unknown,
): jest.CustomMatcherResult {
  const { isNot, promise } = this as unknown as This
  const comment = 'Buffer type validity'
  const options = { comment, isNot, promise }
  const pass = Buffer.isBuffer(received)
  const message = getMessage(
    pass,
    matcherHint('toBeBuffer', undefined, undefined, options),
    printReceived(received),
    printExpected('Buffer'),
  )
  return { message, pass }
}

export function toEqualBuffer(
  this: unknown,
  received: unknown,
  expected: unknown,
): jest.CustomMatcherResult {
  const { isNot, promise } = this as unknown as This
  const comment = 'Buffer type and optional value equality'
  const options = { comment, isNot, promise }
  const pass =
    Buffer.isBuffer(received) && received.compare(toBuffer(expected)) === 0
  const message = getMessage(
    pass,
    matcherHint('toEqualBuffer', undefined, undefined, options),
    printReceived(received),
    printExpected(toBuffer(expected)?.toString('base64')),
  )
  return { message, pass }
}

export function toBeObjectId(
  this: unknown,
  received: unknown,
): jest.CustomMatcherResult {
  const { isNot, promise } = this as unknown as This
  const comment = 'ObjectId type validity'
  const options = { comment, isNot, promise }
  const pass = received instanceof ObjectId
  const message = getMessage(
    pass,
    matcherHint('toBeObjectId', undefined, undefined, options),
    printReceived(received),
    printExpected('ObjectId'),
  )
  return { message, pass }
}

export function toEqualObjectId(
  this: unknown,
  received: unknown,
  expected: unknown,
): jest.CustomMatcherResult {
  const { isNot, promise } = this as unknown as This
  const comment = 'ObjectId type and optional value equality'
  const options = { comment, isNot, promise }
  const pass =
    received instanceof ObjectId && received.equals(toObjectId(expected))
  const message = getMessage(
    pass,
    matcherHint('toEqualObjectId', undefined, undefined, options),
    printReceived(received),
    printExpected(toObjectId(expected)?.toString()),
  )
  return { message, pass }
}

export function toBeUUID(
  this: unknown,
  received: unknown,
): jest.CustomMatcherResult {
  const { isNot, promise } = this as unknown as This
  const comment = 'UUID type validity'
  const options = { comment, isNot, promise }
  const pass = received instanceof UUID
  const message = getMessage(
    pass,
    matcherHint('toBeUUID', undefined, undefined, options),
    printReceived(received),
    printExpected('UUID'),
  )
  return { message, pass }
}

export function toEqualUUID(
  this: unknown,
  received: unknown,
  expected: unknown,
): jest.CustomMatcherResult {
  const { isNot, promise } = this as unknown as This
  const comment = 'UUID type and optional value equality'
  const options = { comment, isNot, promise }
  const pass = received instanceof UUID && received.equals(toUUID(expected))
  const message = getMessage(
    pass,
    matcherHint('toEqualUUID', undefined, undefined, options),
    printReceived(received),
    printExpected(toUUID(expected)?.toString()),
  )
  return { message, pass }
}

function getMessage(
  pass: boolean,
  hint: string,
  received: string,
  expected: string,
): () => string {
  const not = pass ? 'not ' : ''
  return () => `${hint}\n\nExpected: ${not}${expected}\nReceived: ${received}`
}
