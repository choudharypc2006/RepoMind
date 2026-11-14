import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  saveAnalysis,
  getUserAnalyses,
  getAnalysisById,
  deleteAnalysis,
  getFileAnalysis,
} from '../controllers/analysisController.js';

const router = express.Router();

// All analysis routes require authentication
router.use(requireAuth);

router.post('/', saveAnalysis);        // POST /api/analysis
router.get('/', getUserAnalyses);       // GET  /api/analysis
router.get('/file', getFileAnalysis);   // GET  /api/analysis/file?repo=...&path=...
router.get('/:id', getAnalysisById);    // GET  /api/analysis/:id
router.delete('/:id', deleteAnalysis);  // DELETE /api/analysis/:id

export default router;

