import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

// GET / - Root service status
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    status: 'online',
    service: 'RepoMind Backend API',
    version: '1.0.0',
    description: 'AI-Powered GitHub Repository Code Analysis Service',
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      connected: dbState === 1,
      name: mongoose.connection.name || null,
    },
    endpoints: {
      health: 'GET /api/health',
      dbStatus: 'GET /api/health/db',
      repoMetadata: 'GET /api/github/repo?url=:githubUrl',
      fileTree: 'GET /api/github/tree?url=:githubUrl[&branch=:branch]',
      fileContent: 'GET /api/github/file?url=:githubUrl&path=:filePath[&branch=:branch]',
      aiExplain: 'POST /api/ai/explain',
      aiChat: 'POST /api/ai/chat',
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/health - Health check endpoint
router.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  res.status(200).json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      connected: isDbConnected,
      readyState: dbState,
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/health/db - Development test endpoint to verify MongoDB connectivity
router.get('/api/health/db', (req, res) => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  if (state === 1) {
    return res.status(200).json({
      success: true,
      message: 'MongoDB is connected and operational',
      database: {
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        port: mongoose.connection.port,
        readyState: states[state],
      },
    });
  }

  return res.status(503).json({
    success: false,
    message: state === 0 && !process.env.MONGODB_URI
      ? 'MongoDB is disconnected (MONGODB_URI is not configured in backend/.env)'
      : `MongoDB is not connected (current state: ${states[state] || state})`,
    database: {
      readyState: states[state] || 'Unknown',
      configured: Boolean(process.env.MONGODB_URI),
    },
  });
});

export default router;

