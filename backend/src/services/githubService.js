import axios from 'axios';

// Maximum file size in bytes that we'll fetch and display (500 KB)
const MAX_FILE_SIZE_BYTES = 500 * 1024;

// Binary/non-text file extensions that should not be fetched
const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'svg', 'webp', 'avif',
  'mp3', 'mp4', 'wav', 'ogg', 'webm', 'avi', 'mov', 'flac',
  'zip', 'tar', 'gz', 'bz2', 'rar', '7z', 'jar', 'war',
  'exe', 'dll', 'so', 'dylib', 'bin', 'dmg', 'iso', 'msi',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'ttf', 'otf', 'woff', 'woff2', 'eot',
  'pyc', 'pyo', 'class', 'o', 'obj',
  'sqlite', 'db', 'lock',
]);

// Detect programming language from file extension
function detectLanguage(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'java':
      return 'java';
    case 'cpp':
    case 'c':
    case 'h':
    case 'hpp':
      return 'cpp';
    case 'json':
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'yml':
    case 'yaml':
    case 'toml':
      return 'yaml';
    case 'html':
      return 'html';
    case 'css':
    case 'scss':
      return 'css';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'shell';
    case 'rb':
      return 'ruby';
    case 'php':
      return 'php';
    case 'swift':
      return 'swift';
    case 'kt':
    case 'kts':
      return 'kotlin';
    case 'sql':
      return 'sql';
    case 'xml':
      return 'xml';
    case 'env':
    case 'gitignore':
    case 'dockerignore':
    case 'editorconfig':
      return 'text';
    default:
      return 'text';
  }
}

// Check if a file extension is a known binary format
function isBinaryFile(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

// Format bytes into readable string (e.g. 1.2 KB, 350 B)
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Convert flat GitHub Git Tree array into a nested directory tree
function buildNestedTree(flatTree) {
  const root = [];
  const map = {};

  // First sort flatTree so parent folders are processed before children
  const sortedItems = [...flatTree].sort((a, b) => {
    const aDepth = a.path.split('/').length;
    const bDepth = b.path.split('/').length;
    if (aDepth !== bDepth) return aDepth - bDepth;
    // Folders first
    if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const item of sortedItems) {
    const parts = item.path.split('/');
    const name = parts[parts.length - 1];
    const isFolder = item.type === 'tree';

    const node = {
      name,
      type: isFolder ? 'folder' : 'file',
      path: item.path,
      ...(isFolder
        ? { children: [] }
        : {
            size: formatBytes(item.size || 0),
            rawSize: item.size || 0,
            language: detectLanguage(name),
            sha: item.sha,
          }),
    };

    map[item.path] = node;

    if (parts.length === 1) {
      // Item sits at root of the repository
      root.push(node);
    } else {
      // Find parent directory
      const parentPath = parts.slice(0, -1).join('/');
      if (map[parentPath] && map[parentPath].children) {
        map[parentPath].children.push(node);
      } else {
        // Fallback: if parent not found in tree, place at root
        root.push(node);
      }
    }
  }

  // Recursive sorting: Folders first, then alphabetical
  function sortNodes(nodes) {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children);
      }
    }
    return nodes;
  }

  return sortNodes(root);
}

// Build Axios headers, attaching GITHUB_TOKEN if present
function getGitHubHeaders() {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'RepoMind-Code-Analysis-App',
  };

  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

// Translate raw GitHub errors into user-friendly messages
function handleGitHubError(error, context = 'GitHub API') {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || '';

    if (status === 404) {
      const err = new Error('Repository not found. Please ensure the repository is public and the URL is spelled correctly.');
      err.statusCode = 404;
      throw err;
    }

    if (status === 403 || status === 429) {
      const isRateLimit = message.toLowerCase().includes('rate limit');
      const err = new Error(
        isRateLimit
          ? 'GitHub API rate limit exceeded (60 requests/hour for unauthenticated users). Add a GITHUB_TOKEN in backend/.env to increase this to 5,000 requests/hour.'
          : 'Access forbidden by GitHub API. The repository may be private or restricted.'
      );
      err.statusCode = status;
      throw err;
    }

    const err = new Error(`GitHub API error (${status}): ${message || 'Unexpected response'}`);
    err.statusCode = status;
    throw err;
  }

  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    const err = new Error('Request to GitHub timed out. Please check your network connection.');
    err.statusCode = 504;
    throw err;
  }

  throw error;
}

/**
 * Fetch repository metadata from GitHub REST API
 */
export async function getRepositoryMetadata(owner, repo) {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: getGitHubHeaders(),
        timeout: 10000,
      }
    );

    const data = response.data;

    return {
      id: `${owner}-${repo}`.toLowerCase(),
      name: data.name,
      fullName: data.full_name,
      owner: data.owner.login,
      ownerAvatar: data.owner.avatar_url,
      description: data.description || 'No description provided.',
      defaultBranch: data.default_branch || 'main',
      stars: data.stargazers_count,
      forks: data.forks_count,
      watchers: data.watchers_count,
      openIssues: data.open_issues_count,
      primaryLanguage: data.language || 'Plain Text',
      license: data.license?.spdx_id || data.license?.name || 'No License',
      url: data.html_url,
      size: `${Math.round((data.size / 1024) * 10) / 10} MB`,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      pushedAt: data.pushed_at,
      isPrivate: data.private,
    };
  } catch (error) {
    handleGitHubError(error, `fetching metadata for ${owner}/${repo}`);
  }
}

/**
 * Fetch the file tree using GitHub's Git Trees API
 */
export async function getRepositoryTree(owner, repo, branch) {
  try {
    // 1. If branch is not provided, fetch default branch first
    let targetBranch = branch;
    if (!targetBranch) {
      const meta = await getRepositoryMetadata(owner, repo);
      targetBranch = meta.defaultBranch;
    }

    // 2. Fetch recursive git tree
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`,
      {
        headers: getGitHubHeaders(),
        timeout: 15000,
      }
    );

    const flatTree = response.data.tree || [];
    const isTruncated = Boolean(response.data.truncated);

    // 3. Build nested folder/file hierarchy
    const nestedTree = buildNestedTree(flatTree);

    // Compute summary stats
    let totalFiles = 0;
    let totalFolders = 0;
    let totalBytes = 0;

    for (const item of flatTree) {
      if (item.type === 'blob') {
        totalFiles++;
        totalBytes += item.size || 0;
      } else if (item.type === 'tree') {
        totalFolders++;
      }
    }

    return {
      defaultBranch: targetBranch,
      isTruncated,
      stats: {
        totalFiles,
        totalFolders,
        totalSize: formatBytes(totalBytes),
      },
      tree: nestedTree,
    };
  } catch (error) {
    handleGitHubError(error, `fetching file tree for ${owner}/${repo}`);
  }
}

/**
 * Fetch raw content of a specific file.
 * Rejects binary files and files exceeding the size limit.
 */
export async function getFileContent(owner, repo, branch, filePath) {
  const fileName = filePath.split('/').pop();

  // Guard: reject known binary file types before making any HTTP request
  if (isBinaryFile(fileName)) {
    const err = new Error(
      `Cannot display binary file "${fileName}". Only text-based source code files are supported.`
    );
    err.statusCode = 422;
    throw err;
  }

  try {
    // Attempt raw.githubusercontent.com first (efficient and doesn't hit GitHub API rate limits)
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    const response = await axios.get(rawUrl, {
      responseType: 'text',
      timeout: 10000,
      maxContentLength: MAX_FILE_SIZE_BYTES,
    });

    const content = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data, null, 2);

    const byteSize = Buffer.byteLength(content, 'utf8');

    // Guard: reject if content exceeds size limit (extra safety if header wasn't set)
    if (byteSize > MAX_FILE_SIZE_BYTES) {
      const err = new Error(
        `File "${fileName}" is ${formatBytes(byteSize)}, which exceeds the ${formatBytes(MAX_FILE_SIZE_BYTES)} display limit. Large files cannot be rendered in the browser.`
      );
      err.statusCode = 422;
      throw err;
    }

    const lines = content.split('\n').length;
    const size = formatBytes(byteSize);

    return {
      path: filePath,
      name: fileName,
      content,
      lines,
      size,
      language: detectLanguage(filePath),
      isBinary: false,
    };
  } catch (error) {
    // If our own size/binary guard threw, re-throw directly
    if (error.statusCode === 422) {
      throw error;
    }

    // Fallback: GitHub Contents API
    try {
      const apiResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
        {
          headers: getGitHubHeaders(),
          timeout: 10000,
        }
      );

      // Guard: check size from API metadata before decoding
      const apiFileSize = apiResponse.data.size || 0;
      if (apiFileSize > MAX_FILE_SIZE_BYTES) {
        const err = new Error(
          `File "${fileName}" is ${formatBytes(apiFileSize)}, which exceeds the ${formatBytes(MAX_FILE_SIZE_BYTES)} display limit.`
        );
        err.statusCode = 422;
        throw err;
      }

      if (apiResponse.data.encoding === 'base64' && apiResponse.data.content) {
        const decoded = Buffer.from(apiResponse.data.content, 'base64').toString('utf8');
        return {
          path: filePath,
          name: fileName,
          content: decoded,
          lines: decoded.split('\n').length,
          size: formatBytes(apiResponse.data.size || 0),
          language: detectLanguage(filePath),
          isBinary: false,
        };
      }

      throw new Error('Unable to decode file content.');
    } catch (fallbackError) {
      // If the fallback itself threw a 422 (size limit), pass it through
      if (fallbackError.statusCode === 422) {
        throw fallbackError;
      }
      handleGitHubError(error, `fetching file content for ${filePath}`);
    }
  }
}

