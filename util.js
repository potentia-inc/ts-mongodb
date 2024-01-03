export { setTimeout as sleep } from 'node:timers/promises';
export function isNil(x) {
    return x === null || x === undefined;
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
//# sourceMappingURL=util.js.map