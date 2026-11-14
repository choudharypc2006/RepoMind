import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getUserRepositories,
  saveUserRepository,
  deleteUserRepository,
} from '../controllers/repoHistoryController.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

router.get('/', getUserRepositories);
router.post('/', saveUserRepository);
router.delete('/:repoId', deleteUserRepository);

export default router;

