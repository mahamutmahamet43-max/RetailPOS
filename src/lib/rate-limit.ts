interface RateLimitEntry {
  count: number
  resetAt: number
}

const stores = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL = 60_000

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of stores) {
    if (now > entry.resetAt) {
      stores.delete(key)
    }
  }
}, CLEANUP_INTERVAL)

export interface RateLimitConfig {
  interval: number
  maxRequests: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = stores.get(key)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.interval
    stores.set(key, { count: 1, resetAt })
    return { success: true, remaining: config.maxRequests - 1, resetAt }
  }

  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt }
}

export function rateLimitMiddleware(
  key: string,
  config: RateLimitConfig
): Response | null {
  const result = checkRateLimit(key, config)
  if (!result.success) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }
  return null
}
