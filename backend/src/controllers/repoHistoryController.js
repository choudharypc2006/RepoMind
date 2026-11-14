import Repository from '../models/Repository.js';

/**
 * GET /api/user-repos
 * Get all repositories analyzed by the logged in user
 */
export async function getUserRepositories(req, res, next) {
  try {
    const repos = await Repository.find({ userId: req.user._id })
      .sort({ analyzedAt: -1, updatedAt: -1 })
      .select('-__v');

    const formatted = repos.map((doc) => {
      const obj = doc.toObject();
      return {
        ...obj,
        id: obj.repoId || String(obj._id),
      };
    });

    console.log(
      `[RepoHistory] GET /api/user-repos: Found ${formatted.length} repos for user ${req.user.email}`
    );

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error('[RepoHistory] Error fetching user repos:', error);
    next(error);
  }
}

/**
 * POST /api/user-repos
 * Save or update an analyzed repository for the logged in user
 */
export async function saveUserRepository(req, res, next) {
  try {
    const repoData = req.body;

    if (!repoData.fullName && !repoData.name) {
      return res.status(400).json({
        success: false,
        error: 'Repository name or fullName is required.',
      });
    }

    const fullName = repoData.fullName || `${repoData.owner || 'unknown'}/${repoData.name}`;
    const repoId = String(repoData.id || fullName);

    const updated = await Repository.findOneAndUpdate(
      {
        userId: req.user._id,
        fullName,
      },
      {
        userId: req.user._id,
        repoId,
        fullName,
        name: repoData.name || fullName.split('/')[1] || fullName,
        owner: repoData.owner || fullName.split('/')[0] || '',
        ownerAvatar: repoData.ownerAvatar || '',
        description: repoData.description || '',
        stars: repoData.stars || 0,
        forks: repoData.forks || 0,
        watchers: repoData.watchers || 0,
        openIssues: repoData.openIssues || 0,
        defaultBranch: repoData.defaultBranch || 'main',
        primaryLanguage: repoData.primaryLanguage || 'JavaScript',
        license: repoData.license || 'MIT',
        url: repoData.url || `https://github.com/${fullName}`,
        size: repoData.size !== undefined ? repoData.size : '0 MB',
        analyzedAt: new Date(),
        analysisStats: repoData.analysisStats || {},
        files: repoData.files || [],
        isLiveRepo: true,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(
      `[RepoHistory] POST /api/user-repos: Saved "${fullName}" to MongoDB for user ${req.user.email}`
    );

    res.status(200).json({
      success: true,
      message: 'Repository saved to history.',
      data: {
        ...updated.toObject(),
        id: updated.repoId || String(updated._id),
      },
    });
  } catch (error) {
    console.error('[RepoHistory] Error saving user repo to MongoDB:', error);
    next(error);
  }
}

/**
 * DELETE /api/user-repos/:repoId
 * Remove a repository from the user's history
 */
export async function deleteUserRepository(req, res, next) {
  try {
    const { repoId } = req.params;

    const deleted = await Repository.findOneAndDelete({
      userId: req.user._id,
      $or: [
        { repoId },
        { fullName: decodeURIComponent(repoId) },
        ...(repoId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: repoId }] : []),
      ],
    });

    console.log(
      `[RepoHistory] DELETE /api/user-repos: Removed repo "${repoId}" for user ${req.user.email}`
    );

    res.status(200).json({
      success: true,
      message: 'Repository removed from history.',
      deleted: !!deleted,
    });
  } catch (error) {
    console.error('[RepoHistory] Error deleting user repo from MongoDB:', error);
    next(error);
  }
}
