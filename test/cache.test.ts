import { Cache } from '../src/cache'
import { sleep } from '../src/util'

describe('cache', () => {
  it('should set key/value cache', () => {
    const cache = new Cache<number>({ ttl: 60_000, capacity: 1000 })
    cache.set('a', 1)
    cache.set('b', 2)
    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBeUndefined()
  })

  it('should get undefined when expiration', async () => {
    const cache = new Cache<number>({ ttl: 1, capacity: 1000 })
    cache.set('a', 1)
    cache.set('b', 2)
    await sleep(10)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('c')).toBeUndefined()
  })

  it('should delete the oldest if the cache is full', () => {
    const cache = new Cache<number>({ ttl: 60_000, capacity: 3 })
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    cache.set('d', 4)
    cache.set('a', 5)
    expect(cache.get('a')).toBe(5)
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('c')).toBe(3)
    expect(cache.get('d')).toBe(4)
    expect(cache.get('e')).toBeUndefined()
  })
})
