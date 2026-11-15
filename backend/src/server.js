import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/healthRoutes.js';
import githubRoutes from './routes/githubRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import repoHistoryRoutes from './routes/repoHistoryRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 0. Verify Environment Variables
const recommendedVars = ['JWT_SECRET', 'GEMINI_API_KEY', 'MONGODB_URI'];
const missingVars = recommendedVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.warn(`⚠️ [Startup Warning]: The following environment variables are not set: ${missingVars.join(', ')}`);
  console.warn(`   Some features (AI analysis, database persistence, auth) may be limited until configured in .env.`);
}

// 1. Initialize Database Connection
connectDB();

// 2. CORS Configuration with Credentials support for HTTP-only Cookies
const configuredOrigins = (process.env.ALLOWED_ORIGINS || FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const defaultDevOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultDevOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        process.env.NODE_ENV !== 'production';

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Crucial for receiving/sending HTTP-only cookies
  })
);

// 3. Request body & Cookie parsing (10mb limit protects against payload bomb attacks)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Mount Routes
app.use('/', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/user-repos', repoHistoryRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/ai', aiRoutes);

// 5. Handle 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
});

// 6. Centralized Error Handling Middleware
app.use(errorHandler);

// 7. Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 RepoMind Backend Server running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔗 Allowed Frontend Origins: ${allowedOrigins.join(', ')}`);
  console.log(`🛡️  Rate Limiting: Enabled for AI & Auth`);
  console.log(`===============================================`);
});

export default app;
