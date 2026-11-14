/**
 * Utility function to validate a GitHub repository URL
 * and extract the owner and repository name.
 * 
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/
 * - http://github.com/owner/repo
 * - github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 * - https://github.com/owner/repo/tree/branch/path (auto-extracts repo)
 */
export function parseGitHubUrl(rawUrl) {
  const createValidationError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
  };

  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw createValidationError('Repository URL parameter is required.');
  }

  const trimmed = rawUrl.trim();

  // Support SSH git URLs: git@github.com:owner/repo.git
  if (trimmed.startsWith('git@github.com:')) {
    const sub = trimmed.replace('git@github.com:', '');
    const parts = sub.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const owner = parts[0];
      const repo = parts[1].replace(/\.git$/, '');
      return {
        owner,
        repo,
        cleanUrl: `https://github.com/${owner}/${repo}`,
      };
    }
  }

  // Normalize: prepend https:// if missing protocol
  const withProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;

  try {
    const urlObj = new URL(withProtocol);

    if (urlObj.hostname !== 'github.com' && urlObj.hostname !== 'www.github.com') {
      throw createValidationError('Only public repositories on github.com are currently supported.');
    }

    // Pathname looks like: /owner/repo or /owner/repo.git or /owner/repo/tree/main
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);

    if (pathSegments.length < 2) {
      throw createValidationError('Invalid GitHub URL. Must contain both owner and repository name (e.g., https://github.com/facebook/react).');
    }

    // If extra path segments are present, verify they are standard sub-routes like tree or blob
    if (pathSegments.length > 2 && !['tree', 'blob'].includes(pathSegments[2])) {
      throw createValidationError('Invalid GitHub URL structure. Must point to a repository root (e.g. https://github.com/facebook/react).');
    }

    const owner = pathSegments[0];
    let repo = pathSegments[1];

    // Strip trailing .git if present
    if (repo.endsWith('.git')) {
      repo = repo.slice(0, -4);
    }

    // Validate characters (GitHub usernames and repo names follow specific alphanumeric + hyphen/underscore rules)
    const validIdentifier = /^[a-zA-Z0-9_.-]+$/;
    if (!validIdentifier.test(owner) || !validIdentifier.test(repo)) {
      throw createValidationError('Invalid characters in GitHub owner or repository name.');
    }

    return {
      owner,
      repo,
      cleanUrl: `https://github.com/${owner}/${repo}`,
    };
  } catch (err) {
    if (err.statusCode === 400) {
      throw err;
    }
    throw createValidationError('Malformed URL provided. Please enter a valid URL like https://github.com/facebook/react.');
  }
}

export default parseGitHubUrl;
