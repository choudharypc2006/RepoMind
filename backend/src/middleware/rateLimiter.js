/**
 * Lightweight, zero-dependency in-memory rate limiting middleware.
 * Protects expensive AI endpoints (Google Gemini) and API endpoints from quota exhaustion.
 */

export function createRateLimiter({
  windowMs = 60 * 1000, // 1 minute window
  maxRequests = 20,     // 20 requests per window
  message = 'Too many requests. Please wait a moment before trying again.',
} = {}) {
  const requests = new Map();

  // Periodically purge stale IP entries every 2 minutes to prevent memory leak
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requests.entries()) {
      if (now > record.resetTime) {
        requests.delete(key);
      }
    }
  }, Math.max(windowMs * 2, 60000));

  // Allow Node process to exit gracefully without waiting for interval
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return function rateLimiter(req, res, next) {
    // Identify client by authenticated user ID if present, otherwise by IP
    const clientId = req.user?._id || req.ip || req.connection?.remoteAddress || 'anonymous';
    const now = Date.now();

    let clientRecord = requests.get(clientId);

    if (!clientRecord || now > clientRecord.resetTime) {
      clientRecord = {
        count: 1,
        resetTime: now + windowMs,
      };
      requests.set(clientId, clientRecord);
    } else {
      clientRecord.count += 1;
    }

    const remaining = Math.max(0, maxRequests - clientRecord.count);
    const resetSeconds = Math.ceil((clientRecord.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(clientRecord.resetTime / 1000));

    if (clientRecord.count > maxRequests) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: resetSeconds,
        statusCode: 429,
      });
    }

    next();
  };
}

// Preset rate limiters
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 15,      // 15 AI calls per minute
  message: 'Gemini AI rate limit reached. You can make up to 15 AI analyses per minute. Please wait before trying again.',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 30,          // 30 auth attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

export default createRateLimiter;

