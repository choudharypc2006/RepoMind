import Analysis from '../models/Analysis.js';

/**
 * POST /api/analysis
 * Save a completed AI analysis to MongoDB.
 * userId comes from req.user (set by requireAuth middleware), never from the request body.
 */
export async function saveAnalysis(req, res, next) {
  try {
    const {
      repositoryName,
      repositoryUrl,
      owner,
      selectedFile,
      language,
      explanation,
      analysisData,
    } = req.body;

    // --- Validate required fields ---
    if (!repositoryName || !selectedFile || !explanation) {
      return res.status(400).json({
        success: false,
        error: 'repositoryName, selectedFile, and explanation are required.',
      });
    }

    // Save or update existing analysis for this file & user
    const analysis = await Analysis.findOneAndUpdate(
      {
        userId: req.user._id,
        repositoryName,
        selectedFile,
      },
      {
        userId: req.user._id,
        repositoryName,
        repositoryUrl: repositoryUrl || '',
        owner: owner || '',
        selectedFile,
        language: language || 'text',
        explanation,
        analysisData: analysisData || null,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(
      `[Analysis] Saved full AI analysis for "${repositoryName}/${selectedFile}" (user: ${req.user.email})`
    );

    res.status(200).json({
      success: true,
      message: 'Analysis saved successfully.',
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/analysis/file?repo=...&path=...
 * Fetch previously saved analysis for a specific file in a repository
 */
export async function getFileAnalysis(req, res, next) {
  try {
    const { repo, path } = req.query;

    if (!repo || !path) {
      return res.status(400).json({
        success: false,
        error: 'Query parameters "repo" and "path" are required.',
      });
    }

    const analysis = await Analysis.findOne({
      userId: req.user._id,
      repositoryName: repo,
      selectedFile: path,
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: analysis || null,
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
      .sort({ updatedAt: -1, createdAt: -1 })
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
