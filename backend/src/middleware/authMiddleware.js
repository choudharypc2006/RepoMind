import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes - Verifies JWT from HTTP-only cookie and attaches user to req.user
 */
export async function requireAuth(req, res, next) {
  try {
    // 1. Read token from cookie (or Authorization header as fallback)
    const token =
      req.cookies?.repomind_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized. Please log in to access this resource.',
      });
    }

    // 2. Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        error: 'Authentication configuration error on server.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Your session has expired. Please log in again.',
          isExpired: true,
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token.',
      });
    }

    // 3. Find user in database (excluding password hash)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'The account for this session no longer exists.',
      });
    }

    // 4. Attach verified user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

