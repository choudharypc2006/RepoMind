/**
 * Client service to communicate with the RepoMind Express backend.
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

/**
 * Check if the backend server is reachable and online
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'healthy';
  } catch (err) {
    return false;
  }
}

/**
 * Fetch repository metadata from backend (which calls GitHub REST API)
 */
export async function fetchRepoMetadata(repoUrl) {
  const endpoint = `${API_BASE_URL}/api/github/repo?url=${encodeURIComponent(repoUrl)}`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (networkError) {
    throw new Error(
      'Cannot connect to the RepoMind backend at ' + API_BASE_URL + '. Please check that the backend server is running on port 3000.'
    );
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || `Failed to fetch repository metadata (HTTP ${response.status})`);
  }

  return json.data;
}

/**
 * Fetch recursive repository file tree from backend (which calls GitHub Git Trees API)
 */
export async function fetchRepoTree(repoUrl, branch) {
  let endpoint = `${API_BASE_URL}/api/github/tree?url=${encodeURIComponent(repoUrl)}`;
  if (branch) {
    endpoint += `&branch=${encodeURIComponent(branch)}`;
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (networkError) {
    throw new Error(
      'Cannot connect to the RepoMind backend. Please ensure the backend server is running.'
    );
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || `Failed to fetch file tree (HTTP ${response.status})`);
  }

  return json.data;
}

/**
 * Fetch raw file content from backend
 */
export async function fetchFileContent(repoUrl, filePath, branch) {
  let endpoint = `${API_BASE_URL}/api/github/file?url=${encodeURIComponent(repoUrl)}&path=${encodeURIComponent(filePath)}`;
  if (branch) {
    endpoint += `&branch=${encodeURIComponent(branch)}`;
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (networkError) {
    throw new Error('Failed to connect to backend service.');
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch file content.');
  }

  return json.data;
}

