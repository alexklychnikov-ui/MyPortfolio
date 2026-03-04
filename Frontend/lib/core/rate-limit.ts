const LIMIT = 5
const WINDOW_MS = 15 * 60 * 1000

const TESTIMONIAL_LIMIT = 3
const TESTIMONIAL_WINDOW_MS = 60 * 60 * 1000

const store = new Map<string, { count: number; resetAt: number }>()
const testimonialStore = new Map<string, { count: number; resetAt: number }>()

function cleanup(map: Map<string, { count: number; resetAt: number }>) {
  const now = Date.now()
  for (const [key, v] of map.entries()) {
    if (v.resetAt <= now) map.delete(key)
  }
}

function check(
  ip: string,
  map: Map<string, { count: number; resetAt: number }>,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  cleanup(map)
  const now = Date.now()
  const entry = map.get(ip)
  if (!entry) {
    map.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }
  if (entry.resetAt <= now) {
    map.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }
  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  entry.count += 1
  return { allowed: true }
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  return check(ip, store, LIMIT, WINDOW_MS)
}

export function checkTestimonialRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  return check(ip, testimonialStore, TESTIMONIAL_LIMIT, TESTIMONIAL_WINDOW_MS)
}
