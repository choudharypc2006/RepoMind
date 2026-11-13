import Analysis from '../models/Analysis.js';

/**
 * POST /api/analysis
 * Save a completed AI analysis to MongoDB.
 * userId comes from req.user (set by requireAuth middleware), never from the request body.
 */
export async function saveAnalysis(req, res, next) {
  try {
    const { repositoryName, repositoryUrl, owner, selectedFile, language, explanation } = req.body;

    // --- Validate required fields ---
    if (!repositoryName || !selectedFile || !explanation) {
      return res.status(400).json({
        success: false,
        error: 'repositoryName, selectedFile, and explanation are required.',
      });
    }

    // --- Prevent duplicate saves (same user + same repo + same file within 30 seconds) ---
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const duplicate = await Analysis.findOne({
      userId: req.user._id,
      repositoryName,
      selectedFile,
      createdAt: { $gte: thirtySecondsAgo },
    });

    if (duplicate) {
      // Return the existing record instead of creating a new one
      return res.status(200).json({
        success: true,
        message: 'Analysis already saved.',
        data: duplicate,
      });
    }

    // --- Create the analysis document ---
    const analysis = await Analysis.create({
      userId: req.user._id,
      repositoryName,
      repositoryUrl: repositoryUrl || '',
      owner: owner || '',
      selectedFile,
      language: language || 'text',
      explanation,
    });

    res.status(201).json({
      success: true,
      message: 'Analysis saved successfully.',
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/analysis
 * Fetch all analyses belonging to the currently authenticated user, sorted newest first.
 */
export async function getUserAnalyses(req, res, next) {
  try {
    const analyses = await Analysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: analyses.length,
      data: analyses,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/analysis/:id
 * Fetch a single analysis — only if it belongs to the authenticated user.
 */
export async function getAnalysisById(req, res, next) {
  try {
    const analysis = await Analysis.findById(req.params.id).select('-__v');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found.',
      });
    }

    // Ownership check
    if (analysis.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this analysis.',
      });
    }

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis ID format.',
      });
    }
    next(error);
  }
}

/**
 * DELETE /api/analysis/:id
 * Delete a single analysis — only if it belongs to the authenticated user.
 */
export async function deleteAnalysis(req, res, next) {
  try {
    const analysis = await Analysis.findById(req.params.id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found.',
      });
    }

    // Ownership check
    if (analysis.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this analysis.',
      });
    }

    await Analysis.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully.',
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis ID format.',
      });
    }
    next(error);
  }
}

