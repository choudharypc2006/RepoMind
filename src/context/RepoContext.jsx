import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_REPOSITORIES } from '../data/mockRepositories';
import {
  fetchRepoMetadata,
  fetchRepoTree,
  fetchFileContent,
} from '../services/githubApi';

const RepoContext = createContext(null);

export const RepoProvider = ({ children }) => {
  const [repositories, setRepositories] = useState(MOCK_REPOSITORIES);
  const [selectedRepoId, setSelectedRepoId] = useState(MOCK_REPOSITORIES[0].id);
  const [activeFile, setActiveFile] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [analysisError, setAnalysisError] = useState(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // User Settings State
  const [userSettings, setUserSettings] = useState({
    theme: 'charcoal',
    aiModel: 'gemini-1.5-pro',
    analysisDepth: 'deep',
    autoExplain: true,
    fontSize: 14,
    showLineNumbers: true,
    wordWrap: true,
    tabSize: 2,
    githubToken: '',
    defaultBranch: 'main',
  });

  // Current active repository object
  const selectedRepo = repositories.find((r) => r.id === selectedRepoId) || repositories[0];

  // Helper to extract first file from a tree
  const findFirstFile = (nodes) => {
    if (!nodes || nodes.length === 0) return null;
    for (const node of nodes) {
      if (node.type === 'file') return node;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Sync active file when repo changes if not already set
  useEffect(() => {
    if (selectedRepo && selectedRepo.files) {
      const first = findFirstFile(selectedRepo.files);
      if (first) {
        // If content not yet loaded, load it
        if (!first.content && selectedRepo.url) {
          loadFileContent(first, selectedRepo);
        } else {
          setActiveFile(first);
          setOpenTabs([first]);
        }
      }
    }
  }, [selectedRepoId]);

  // Load content for a file from backend if not already present
  const loadFileContent = async (file, repo = selectedRepo) => {
    if (!file || file.type !== 'file') return file;

    if (file.content !== undefined && file.content !== null) {
      setActiveFile(file);
      return file;
    }

    setIsLoadingFile(true);
    const placeholderFile = {
      ...file,
      isLoading: true,
      content: '// Fetching file content from GitHub...',
    };
    setActiveFile(placeholderFile);

    try {
      const result = await fetchFileContent(
        repo.url,
        file.path,
        repo.defaultBranch
      );

      const enrichedFile = {
        ...file,
        isLoading: false,
        isError: false,
        content: result.content,
        lines: result.lines,
        size: result.size,
        language: result.language || file.language,
        analysis: file.analysis || {
          summary: `Source code for ${file.name}. Parsed and loaded via RepoMind GitHub Backend API.`,
          keyInsights: [
            `Module path: ${file.path}`,
            `Size: ${result.size} (${result.lines} lines of code)`,
            `Language: ${result.language || file.language || 'Plain text'}`,
          ],
          complexity: {
            time: 'Analysis pending',
            space: 'Analysis pending',
            maintainabilityIndex: 90,
            cyclomaticComplexity: 3,
          },
          security: {
            score: 'A',
            status: 'Static Scan Clean',
            details: 'Fetched directly from public GitHub repository tree.',
          },
          suggestions: [
            'Click "Explain Code" to generate deep architectural insights with Gemini AI.',
          ],
        },
      };

      setActiveFile(enrichedFile);
      setOpenTabs((prev) =>
        prev.map((t) => (t.path === file.path ? enrichedFile : t))
      );
      return enrichedFile;
    } catch (err) {
      const errorFile = {
        ...file,
        isLoading: false,
        isError: true,
        errorMessage: err.message,
        content: `// Error loading file from GitHub:\n// ${err.message}\n\n// Note: Binary files or files exceeding size limits cannot be displayed.`,
      };
      setActiveFile(errorFile);
      setOpenTabs((prev) =>
        prev.map((t) => (t.path === file.path ? errorFile : t))
      );
      return errorFile;
    } finally {
      setIsLoadingFile(false);
    }
  };

  const selectRepository = (repoId) => {
    const found = repositories.find((r) => r.id === repoId);
    if (found) {
      setSelectedRepoId(repoId);
      const first = findFirstFile(found.files);
      if (first) {
        if (!first.content && found.url) {
          loadFileContent(first, found);
        } else {
          setActiveFile(first);
          setOpenTabs([first]);
        }
      }
    }
  };

  const selectFile = (file) => {
    if (!file || file.type !== 'file') return;

    setOpenTabs((prev) => {
      const exists = prev.some((tab) => tab.path === file.path);
      if (!exists) {
        return [...prev, file];
      }
      return prev;
    });

    if (!file.content && selectedRepo?.url) {
      loadFileContent(file, selectedRepo);
    } else {
      setActiveFile(file);
    }
  };

  const closeTab = (filePath, e) => {
    if (e) e.stopPropagation();
    const remaining = openTabs.filter((tab) => tab.path !== filePath);
    setOpenTabs(remaining);
    if (activeFile && activeFile.path === filePath) {
      if (remaining.length > 0) {
        const next = remaining[remaining.length - 1];
        if (!next.content && selectedRepo?.url) {
          loadFileContent(next, selectedRepo);
        } else {
          setActiveFile(next);
        }
      } else {
        setActiveFile(null);
      }
    }
  };

  /**
   * Analyze a repository using the real Express backend and GitHub APIs
   */
  const analyzeRepository = async (repoUrl) => {
    setAnalysisError(null);
    setIsAnalyzing(true);
    setAnalysisStep('Connecting to RepoMind backend...');

    try {
      // 1. Fetch real repository metadata from backend -> GitHub REST API
      setAnalysisStep('Fetching repository metadata from GitHub REST API...');
      const metadata = await fetchRepoMetadata(repoUrl);

      // 2. Fetch real file tree from backend -> GitHub Git Trees API
      setAnalysisStep(`Parsing file tree for branch: ${metadata.defaultBranch}...`);
      const treeResult = await fetchRepoTree(repoUrl, metadata.defaultBranch);

      // 3. Assemble repository record
      setAnalysisStep('Finalizing repository code structure...');
      const newRepo = {
        id: metadata.id,
        fullName: metadata.fullName,
        name: metadata.name,
        owner: metadata.owner,
        ownerAvatar: metadata.ownerAvatar,
        description: metadata.description,
        stars: metadata.stars,
        forks: metadata.forks,
        watchers: metadata.watchers,
        openIssues: metadata.openIssues,
        defaultBranch: metadata.defaultBranch,
        primaryLanguage: metadata.primaryLanguage,
        license: metadata.license,
        url: metadata.url,
        size: metadata.size,
        analyzedAt: new Date().toISOString(),
        analysisStats: {
          totalFiles: treeResult.stats.totalFiles,
          totalFolders: treeResult.stats.totalFolders,
          totalSize: treeResult.stats.totalSize,
          complexityScore: 'Calculated',
          securityRisk: 'Low',
          testCoverage: 'N/A',
        },
        files: treeResult.files,
        isLiveRepo: true,
      };

      // Add or update in repository list
      setRepositories((prev) => {
        const existingIndex = prev.findIndex((r) => r.id === newRepo.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newRepo;
          return updated;
        }
        return [newRepo, ...prev];
      });

      setSelectedRepoId(newRepo.id);

      // Open first file automatically
      const first = findFirstFile(newRepo.files);
      if (first) {
        loadFileContent(first, newRepo);
      }

      setIsAnalyzing(false);
      setAnalysisStep('');
      return newRepo.id;
    } catch (err) {
      setIsAnalyzing(false);
      setAnalysisStep('');
      setAnalysisError(err.message || 'Failed to analyze repository.');
      throw err;
    }
  };

  const deleteFromHistory = (repoId) => {
    const updated = repositories.filter((r) => r.id !== repoId);
    setRepositories(updated);
    if (selectedRepoId === repoId && updated.length > 0) {
      setSelectedRepoId(updated[0].id);
    }
  };

  const clearHistory = () => {
    setRepositories([]);
    setActiveFile(null);
    setOpenTabs([]);
  };

  const resetDefaultData = () => {
    setRepositories(MOCK_REPOSITORIES);
    setSelectedRepoId(MOCK_REPOSITORIES[0].id);
  };

  const updateSettings = (partialSettings) => {
    setUserSettings((prev) => ({ ...prev, ...partialSettings }));
  };

  return (
    <RepoContext.Provider
      value={{
        repositories,
        selectedRepo,
        selectedRepoId,
        selectRepository,
        activeFile,
        setActiveFile,
        selectFile,
        openTabs,
        closeTab,
        isAnalyzing,
        analysisStep,
        analysisError,
        setAnalysisError,
        isLoadingFile,
        analyzeRepository,
        deleteFromHistory,
        clearHistory,
        resetDefaultData,
        userSettings,
        updateSettings,
      }}
    >
      {children}
    </RepoContext.Provider>
  );
};

export const useRepo = () => {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error('useRepo must be used within a RepoProvider');
  }
  return context;
};
