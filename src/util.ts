export { setTimeout as sleep } from 'node:timers/promises'

export function isNil<T>(x: T): x is Extract<T, null | undefined> {
  return x === null || x === undefined
}

/*
export function option<Key extends string, Value>(
  key: Key,
  value?: Value,
): Partial<Record<Key, NonNullable<Value>>> {
  const result = isNil(value) ? {} : { [key]: value }
  return result as unknown as Partial<Record<Key, NonNullable<Value>>>
}
*/
