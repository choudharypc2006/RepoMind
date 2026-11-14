import { Router } from 'express';
import { explainFile, chatFile, getModels } from '../controllers/aiController.js';

const router = Router();

// GET /api/ai/models - List supported free high-token Gemini models
router.get('/models', getModels);

// POST /api/ai/explain - Generate AI explanation for the selected code file
router.post('/explain', explainFile);

// POST /api/ai/chat - Interactive conversation with context of the selected file
router.post('/chat', chatFile);

export default router;
