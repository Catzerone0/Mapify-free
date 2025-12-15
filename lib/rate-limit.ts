import { RateLimitError } from "./errors";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// In-memory rate limiter (for single-instance deployment)
// For multi-instance, use Redis
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const keyRequests = this.requests.get(key) || [];
    const validRequests = keyRequests.filter((time) => time > windowStart);

    if (validRequests.length >= config.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  check(key: string, config: RateLimitConfig): void {
    if (!this.isAllowed(key, config)) {
      throw new RateLimitError();
    }
  }

  // Cleanup old entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, times] of this.requests.entries()) {
      const validTimes = times.filter((time) => time > now - 3600000); // Keep 1 hour
      if (validTimes.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimes);
      }
    }
  }
}

export const rateLimiter = new InMemoryRateLimiter();

// Common rate limit configs
export const rateLimitConfigs = {
  // API endpoints: 100 requests per minute
  api: { windowMs: 60000, maxRequests: 100 },
  // Auth endpoints: 5 requests per minute
  auth: { windowMs: 60000, maxRequests: 5 },
  // LLM API key operations: 10 requests per minute
  llmKeys: { windowMs: 60000, maxRequests: 10 },
};
