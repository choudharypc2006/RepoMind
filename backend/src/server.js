import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import githubRoutes from './routes/githubRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 0. Initialize Database Connection
connectDB();

// 1. CORS Configuration with Credentials support for HTTP-only Cookies
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in local dev
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Crucial for receiving/sending HTTP-only cookies
  })
);

// 2. Request body & Cookie parsing
app.use(express.json());
app.use(cookieParser());

// 3. Mount Routes
app.use('/', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/ai', aiRoutes);

// 4. Handle 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// 5. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err.message);

  const statusCode = err.statusCode || (err.response ? err.response.status : 500);
  const errorMessage = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    statusCode,
  });
});

// 6. Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 RepoMind Backend Server running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔗 Allowed Frontend Origin: ${FRONTEND_URL}`);
  console.log(`===============================================`);
});

export default app;

