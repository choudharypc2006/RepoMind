import { parseGitHubUrl } from '../utils/urlParser.js';
import * as githubService from '../services/githubService.js';

/**
 * Controller to fetch repository metadata
 * GET /api/github/repo?url=...
 */
export async function getRepo(req, res, next) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: url (e.g., ?url=https://github.com/facebook/react)',
      });
    }

    const { owner, repo, cleanUrl } = parseGitHubUrl(url);
    const metadata = await githubService.getRepositoryMetadata(owner, repo);

    return res.status(200).json({
      success: true,
      data: {
        ...metadata,
        cleanUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to fetch repository file tree
 * GET /api/github/tree?url=...&branch=...
 */
export async function getTree(req, res, next) {
  try {
    const { url, branch } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: url (e.g., ?url=https://github.com/facebook/react)',
      });
    }

    const { owner, repo, cleanUrl } = parseGitHubUrl(url);
    const treeData = await githubService.getRepositoryTree(owner, repo, branch);

    return res.status(200).json({
      success: true,
      data: {
        owner,
        repo,
        cleanUrl,
        defaultBranch: treeData.defaultBranch,
        isTruncated: treeData.isTruncated,
        stats: treeData.stats,
        files: treeData.tree,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to fetch raw file content
 * GET /api/github/file?url=...&path=...&branch=...
 */
export async function getFile(req, res, next) {
  try {
    const { url, path: filePath, branch } = req.query;

    if (!url || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: url and path (e.g., ?url=https://github.com/facebook/react&path=package.json)',
      });
    }

    const { owner, repo } = parseGitHubUrl(url);

    // If branch not supplied, discover default branch
    let targetBranch = branch;
    if (!targetBranch) {
      const meta = await githubService.getRepositoryMetadata(owner, repo);
      targetBranch = meta.defaultBranch;
    }

    const fileData = await githubService.getFileContent(owner, repo, targetBranch, filePath);

    return res.status(200).json({
      success: true,
      data: fileData,
    });
  } catch (error) {
    next(error);
  }
}

