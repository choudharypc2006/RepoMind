import { Router } from 'express';
import { getRepo, getTree, getFile } from '../controllers/githubController.js';

const router = Router();

// GET /api/github/repo?url=...
router.get('/repo', getRepo);

// GET /api/github/tree?url=...&branch=...
router.get('/tree', getTree);

// GET /api/github/file?url=...&path=...&branch=...
router.get('/file', getFile);

export default router;

