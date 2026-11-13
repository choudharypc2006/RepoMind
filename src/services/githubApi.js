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
      credentials: 'include',
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
      credentials: 'include',
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
      credentials: 'include',
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

/**
 * Generate Gemini AI explanation for a given code file
 */
export async function explainCodeFile({ repoName, filePath, language, code }) {
  const endpoint = `${API_BASE_URL}/api/ai/explain`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        repoName,
        filePath,
        language,
        code,
      }),
    });
  } catch (networkError) {
    throw new Error('Cannot connect to RepoMind AI backend service. Please check that server is running.');
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Failed to generate AI code explanation.');
  }

  return json.data;
}

/**
 * Chat with Gemini about the selected source code file
 */
export async function chatAboutFile({ filePath, code, messages, question }) {
  const endpoint = `${API_BASE_URL}/api/ai/chat`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        filePath,
        code,
        messages,
        question,
      }),
    });
  } catch (networkError) {
    throw new Error('Cannot connect to RepoMind AI backend service.');
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Failed to receive AI chat response.');
  }

  return json.data;
}

// ─── Analysis History API ────────────────────────────────────────────

/**
 * Save a completed AI analysis to the backend (MongoDB)
 */
export async function saveAnalysisToHistory({
  repositoryName,
  repositoryUrl,
  owner,
  selectedFile,
  language,
  explanation,
}) {
  const endpoint = `${API_BASE_URL}/api/analysis`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        repositoryName,
        repositoryUrl,
        owner,
        selectedFile,
        language,
        explanation,
      }),
    });
  } catch (networkError) {
    throw new Error('Cannot connect to backend to save analysis history.');
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Failed to save analysis.');
  }

  return json.data;
}

/**
 * Fetch all analyses for the currently logged-in user
 */
export async function fetchAnalysisHistory() {
  const endpoint = `${API_BASE_URL}/api/analysis`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch (networkError) {
    throw new Error('Cannot connect to backend to fetch analysis history.');
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch analysis history.');
  }

  return json.data;
}

/**
 * Fetch a single analysis by ID
 */
export async function fetchAnalysisById(analysisId) {
  const endpoint = `${API_BASE_URL}/api/analysis/${analysisId}`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch (networkError) {
    throw new Error('Cannot connect to backend to fetch analysis.');
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch analysis.');
  }

  return json.data;
}

/**
 * Delete a single analysis by ID
 */
export async function deleteAnalysisById(analysisId) {
  const endpoint = `${API_BASE_URL}/api/analysis/${analysisId}`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch (networkError) {
    throw new Error('Cannot connect to backend to delete analysis.');
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Failed to delete analysis.');
  }

  return json;
}
