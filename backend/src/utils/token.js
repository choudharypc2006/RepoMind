import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token for a user ID
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {string} Signed JWT
 */
export function generateToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in backend environment variables.');
  }

  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * Set HTTP-only JWT Cookie on response
 * @param {object} res - Express response
 * @param {string} token - Signed JWT string
 */
export function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('repomind_token', token, {
    httpOnly: true, // Prevents client-side JavaScript access (XSS protection)
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'strict' : 'lax', // CSRF mitigation
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  });
}

/**
 * Clear the authentication cookie
 * @param {object} res - Express response
 */
export function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('repomind_token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    expires: new Date(0), // Expire immediately
    path: '/',
  });
}

