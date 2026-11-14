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
 * Fetch supported high-token Gemini models from backend
 */
export async function fetchAiModels() {
  const endpoint = `${API_BASE_URL}/api/ai/models`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return [];
    const json = await response.json();
    return json.data || [];
  } catch (err) {
    return [];
  }
}

/**
 * Generate Gemini AI explanation for a given code file
 */
export async function explainCodeFile({ repoName, filePath, language, code, model }) {
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
        model,
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
export async function chatAboutFile({ filePath, code, messages, question, model }) {
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
        model,
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
  analysisData,
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
        analysisData,
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
 * Fetch saved analysis for a specific file in a repository from MongoDB
 */
export async function fetchFileAnalysisFromDb(repoName, filePath) {
  const endpoint = `${API_BASE_URL}/api/analysis/file?repo=${encodeURIComponent(repoName)}&path=${encodeURIComponent(filePath)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json.data || null;
  } catch (err) {
    return null;
  }
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

// ─── Analyzed Repositories History API ───────────────────────────────

/**
 * Fetch all repositories analyzed by the currently logged-in user
 */
export async function fetchUserReposFromDb() {
  const endpoint = `${API_BASE_URL}/api/user-repos`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) {
      console.warn('[RepoMind API] GET /api/user-repos returned status:', response.status);
      return [];
    }
    const json = await response.json();
    return json.data || [];
  } catch (err) {
    console.error('[RepoMind API] Error connecting to /api/user-repos:', err.message);
    return [];
  }
}

/**
 * Save an analyzed repository to the user's MongoDB history
 */
export async function saveUserRepoToDb(repoData) {
  const endpoint = `${API_BASE_URL}/api/user-repos`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(repoData),
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      console.error('[RepoMind API] POST /api/user-repos failed:', response.status, json?.error);
      return null;
    }
    return json.data || null;
  } catch (err) {
    console.error('[RepoMind API] Network error saving repository to MongoDB:', err.message);
    return null;
  }
}

/**
 * Delete an analyzed repository from the user's MongoDB history
 */
export async function deleteUserRepoFromDb(repoId) {
  const endpoint = `${API_BASE_URL}/api/user-repos/${encodeURIComponent(repoId)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) return false;
    const json = await response.json();
    return json.success;
  } catch (err) {
    console.warn('Failed to delete repository from MongoDB history:', err.message);
    return false;
  }
}
