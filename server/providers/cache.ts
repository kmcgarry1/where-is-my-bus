interface CacheEntry<T> {
  expiresAt: number
  promise?: Promise<T>
  value?: T
}

const cache = new Map<string, CacheEntry<unknown>>()

export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const existing = cache.get(key) as CacheEntry<T> | undefined
  if (existing?.value !== undefined && existing.expiresAt > now) return existing.value
  if (existing?.promise) return existing.promise

  const promise = loader()
  const entry: CacheEntry<T> = {
    expiresAt: now + ttlMs,
    promise,
    value: existing?.value,
  }
  cache.set(key, entry)

  try {
    const value = await promise
    entry.value = value
    return value
  } catch (error) {
    if (existing?.value !== undefined) return existing.value
    throw error
  } finally {
    entry.promise = undefined
  }
}
