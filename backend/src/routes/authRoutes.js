import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public authentication routes (Rate limited to prevent brute force)
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/logout', logout);

// Protected routes (requires valid HTTP-only cookie)
router.get('/me', requireAuth, getMe);

export default router;
