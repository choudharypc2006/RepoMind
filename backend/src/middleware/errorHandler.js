/**
 * Centralized Global Error Handling Middleware for RepoMind Express Backend.
 * Standardizes all error responses and prevents sensitive stack traces or credentials from leaking.
 */
export function errorHandler(err, req, res, next) {
  // Safe logging: log method, url, status, and message without logging body/secrets
  const timestamp = new Date().toISOString();
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // 1. Handle JSON syntax errors from body parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload in request body.';
  }

  // 2. Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const details = Object.values(err.errors || {}).map((e) => e.message);
    message = details.length > 0 ? details.join(', ') : 'Validation failed for request data.';
  }

  // 3. Handle Mongoose CastError (e.g. invalid MongoDB ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field "${err.path}": ${err.value}`;
  }

  // 4. Handle MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'record';
    message = `A record with this ${field} already exists.`;
  }

  // 5. Handle JWT Authentication Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please sign in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please sign in again.';
  }

  // 6. Handle Axios Network Timeouts / Gateway Errors
  if (err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
    statusCode = 504;
    message = 'Upstream service request timed out. Please try again.';
  } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    statusCode = 502;
    message = 'Unable to reach external upstream service.';
  }

  // Log summary safely
  console.error(`[${timestamp}] [Error ${statusCode}] ${req.method} ${req.originalUrl || req.url}: ${message}`);

  // Send standardized JSON response
  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export default errorHandler;

