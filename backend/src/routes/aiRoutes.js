import { Router } from 'express';
import { explainFile, chatFile, getModels } from '../controllers/aiController.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// GET /api/ai/models - List supported free high-token Gemini models
router.get('/models', getModels);

// POST /api/ai/explain - Generate AI explanation for the selected code file (Rate limited)
router.post('/explain', aiRateLimiter, explainFile);

// POST /api/ai/chat - Interactive conversation with context of the selected file (Rate limited)
router.post('/chat', aiRateLimiter, chatFile);

export default router;
