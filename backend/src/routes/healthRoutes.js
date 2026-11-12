import { Router } from 'express';

const router = Router();

// GET / - Root service status
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'RepoMind Backend API',
    version: '1.0.0',
    description: 'AI-Powered GitHub Repository Code Analysis Service',
    endpoints: {
      health: 'GET /api/health',
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
  res.status(200).json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;

