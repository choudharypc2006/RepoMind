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
 * Set HTTP-only JWT Cookie on response.
 * Configured safely for both local development and cross-domain HTTPS production (Vercel/Render).
 * @param {object} res - Express response
 * @param {string} token - Signed JWT string
 */
export function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  // If deployed across different domains, sameSite must be 'none' and secure must be true
  const sameSiteSetting = process.env.COOKIE_SAMESITE || (isProduction ? 'none' : 'lax');
  const isSecure = isProduction || sameSiteSetting === 'none';

  res.cookie('repomind_token', token, {
    httpOnly: true, // Prevents client-side JavaScript access (XSS protection)
    secure: isSecure, // Required if sameSite is 'none'
    sameSite: sameSiteSetting,
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
  const sameSiteSetting = process.env.COOKIE_SAMESITE || (isProduction ? 'none' : 'lax');
  const isSecure = isProduction || sameSiteSetting === 'none';

  res.cookie('repomind_token', '', {
    httpOnly: true,
    secure: isSecure,
    sameSite: sameSiteSetting,
    expires: new Date(0), // Expire immediately
    path: '/',
  });
}

export default { generateToken, setAuthCookie, clearAuthCookie };
