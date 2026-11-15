import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';

/**
 * Controller: Register a new user
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: name, email, and password.',
      });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name must be at least 2 characters long.',
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in.',
      });
    }

    // 3. Hash password using bcrypt (salt rounds: 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create and save user in MongoDB
    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    // 5. Generate JWT and set HTTP-only cookie
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    // 6. Return response with token & sanitized user
    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Log in existing user
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // 3. Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // 4. Generate JWT & set HTTP-only cookie
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    // 5. Return sanitized user data & token
    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Log out user
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

/**
 * Controller: Get currently authenticated user
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  // req.user is attached by requireAuth middleware
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      createdAt: req.user.createdAt,
    },
  });
}

