// Small in-memory per-IP limiter for server routes. Resets per process, which is
// fine for the MVP (no shared store).

const buckets = new Map<string, { count: number; resetAt: number }>()

export function allowRequest(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}
