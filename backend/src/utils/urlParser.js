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
 */
export function parseGitHubUrl(rawUrl) {
  const createValidationError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
  };

  if (!rawUrl || typeof rawUrl !== 'string') {
    throw createValidationError('Repository URL parameter is required.');
  }

  const trimmed = rawUrl.trim();

  // Normalize: prepend https:// if missing protocol
  const withProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;

  try {
    const urlObj = new URL(withProtocol);

    if (urlObj.hostname !== 'github.com' && urlObj.hostname !== 'www.github.com') {
      throw createValidationError('Only public repositories on github.com are currently supported.');
    }

    // Pathname looks like: /owner/repo or /owner/repo.git or /owner/repo/
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);

    if (pathSegments.length < 2) {
      throw createValidationError('Invalid GitHub URL. Must contain both owner and repository name (e.g., https://github.com/facebook/react).');
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

