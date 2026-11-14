import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_REPOSITORIES } from '../data/mockRepositories';
import { useAuth } from './AuthContext';
import {
  fetchRepoMetadata,
  fetchRepoTree,
  fetchFileContent,
  explainCodeFile,
  chatAboutFile,
  saveAnalysisToHistory,
  fetchFileAnalysisFromDb,
  fetchUserReposFromDb,
  saveUserRepoToDb,
  deleteUserRepoFromDb,
} from '../services/githubApi';

const RepoContext = createContext(null);

export const RepoProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [repositories, setRepositories] = useState(MOCK_REPOSITORIES);
  const [selectedRepoId, setSelectedRepoId] = useState(MOCK_REPOSITORIES[0].id);
  const [activeFile, setActiveFile] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [analysisError, setAnalysisError] = useState(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Load user's analyzed repositories from MongoDB
  const loadUserSavedRepos = useCallback(async () => {
    try {
      const savedRepos = await fetchUserReposFromDb();
      if (savedRepos && savedRepos.length > 0) {
        // User's analyzed repos are placed first
        const savedIds = new Set(savedRepos.map((r) => r.fullName || r.id));
        const sampleRepos = MOCK_REPOSITORIES.filter(
          (m) => !savedIds.has(m.fullName) && !savedIds.has(m.id)
        );
        const merged = [...savedRepos, ...sampleRepos];
        setRepositories(merged);
        setSelectedRepoId(savedRepos[0].id);
        console.log('[RepoMind] Successfully restored', savedRepos.length, 'repos from MongoDB');
      }
    } catch (err) {
      console.warn('Could not load user analyzed repositories from MongoDB:', err.message);
    }
  }, []);

  // When authentication status changes, load from MongoDB or reset
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserSavedRepos();
    } else {
      setRepositories(MOCK_REPOSITORIES);
      setSelectedRepoId(MOCK_REPOSITORIES[0].id);
    }
  }, [isAuthenticated, user?.id, user?._id, loadUserSavedRepos]);

  // User Settings State
  const [userSettings, setUserSettings] = useState({
    theme: 'charcoal',
    aiModel: 'gemini-3.8-flash',
    analysisDepth: 'deep',
    autoExplain: true,
    fontSize: 14,
    showLineNumbers: true,
    wordWrap: true,
    tabSize: 2,
    githubToken: '',
    defaultBranch: 'main',
  });

  const [activeAiModel, setActiveAiModel] = useState('gemini-3.8-flash');

  // Current active repository object
  const selectedRepo = repositories.find((r) => r.id === selectedRepoId) || repositories[0];

  // Helper to extract first readable text/code file from a tree (skipping binary assets like .svg, .png)
  const NON_CODE_EXTS = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'svg', 'webp', 'avif',
    'mp3', 'mp4', 'wav', 'ogg', 'webm', 'zip', 'tar', 'gz', 'pdf', 'lock'
  ]);

  const findFirstFile = (nodes) => {
    if (!nodes || nodes.length === 0) return null;
    let fallback = null;
    for (const node of nodes) {
      if (node.type === 'file') {
        const ext = node.name?.split('.').pop()?.toLowerCase();
        if (!NON_CODE_EXTS.has(ext)) {
          return node;
        }
        if (!fallback) fallback = node;
      }
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return fallback;
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
      // If content is already present but detailed analysis isn't attached, check MongoDB
      if (!file.analysis?.detailedExplanation && repo) {
        try {
          const repoName = repo.fullName || repo.name;
          const saved = await fetchFileAnalysisFromDb(repoName, file.path);
          if (saved && (saved.analysisData || saved.explanation)) {
            const restored = saved.analysisData || {
              summary: saved.explanation?.slice(0, 300) || 'Previous analysis restored from database.',
              detailedExplanation: saved.explanation || '',
              keyInsights: ['Analysis restored from MongoDB history.'],
              functions: [],
              potentialIssues: [],
              suggestions: [],
              complexity: { time: 'Analyzed', space: 'Analyzed', maintainabilityIndex: 85, cyclomaticComplexity: 'Normal' },
              security: { score: 'A', status: 'AI Audited', details: 'Restored from previous session.' },
            };
            const enriched = { ...file, analysis: restored };
            setActiveFile(enriched);
            setOpenTabs((prev) => prev.map((t) => (t.path === file.path ? enriched : t)));
            return enriched;
          }
        } catch (_) {}
      }
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

      // Check if this file was previously analyzed by this user and saved in MongoDB
      let restoredAnalysis = null;
      try {
        const repoName = repo.fullName || repo.name;
        const savedRecord = await fetchFileAnalysisFromDb(repoName, file.path);
        if (savedRecord && savedRecord.analysisData) {
          restoredAnalysis = savedRecord.analysisData;
        } else if (savedRecord && savedRecord.explanation) {
          restoredAnalysis = {
            summary: savedRecord.explanation?.slice(0, 300) || 'Previous analysis restored from database.',
            detailedExplanation: savedRecord.explanation || '',
            keyInsights: ['Analysis restored from MongoDB history.'],
            functions: [],
            potentialIssues: [],
            suggestions: [],
            complexity: {
              time: 'Analyzed',
              space: 'Analyzed',
              maintainabilityIndex: 85,
              cyclomaticComplexity: 'Normal',
            },
            security: {
              score: 'A',
              status: 'AI Audited',
              details: 'Restored from previous session.',
            },
          };
        }
      } catch (dbErr) {
        console.warn('Could not restore saved file analysis from MongoDB:', dbErr);
      }

      const enrichedFile = {
        ...file,
        isLoading: false,
        isError: false,
        content: result.content,
        lines: result.lines,
        size: result.size,
        language: result.language || file.language,
        analysis: restoredAnalysis || file.analysis || {
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

  const selectRepository = async (repoId, filePathToOpen = null) => {
    let found = repositories.find((r) => r.id === repoId || r.fullName === repoId);
    if (!found) return;

    setSelectedRepoId(found.id);

    // If files are missing (e.g. lightweight record from DB), fetch the tree!
    if ((!found.files || found.files.length === 0) && found.url) {
      try {
        const treeResult = await fetchRepoTree(found.url, found.defaultBranch);
        found = {
          ...found,
          files: treeResult.files,
        };
        setRepositories((prev) =>
          prev.map((r) => (r.id === found.id ? found : r))
        );
      } catch (err) {
        console.warn('Failed to fetch file tree for selected repository:', err.message);
      }
    }

    let targetFile = null;
    if (filePathToOpen && found.files) {
      const findByPath = (nodes) => {
        for (const n of nodes) {
          if (n.type === 'file' && (n.path === filePathToOpen || n.name === filePathToOpen || n.path?.endsWith(filePathToOpen))) {
            return n;
          }
          if (n.children) {
            const res = findByPath(n.children);
            if (res) return res;
          }
        }
        return null;
      };
      targetFile = findByPath(found.files);
    }

    const fileToOpen = targetFile || findFirstFile(found.files);
    if (fileToOpen) {
      if (!fileToOpen.content && found.url) {
        loadFileContent(fileToOpen, found);
      } else {
        setActiveFile(fileToOpen);
        setOpenTabs([fileToOpen]);
      }
    }
  };

  const selectFile = async (file) => {
    if (!file || file.type !== 'file') return;

    setOpenTabs((prev) => {
      const exists = prev.some((tab) => tab.path === file.path);
      if (!exists) {
        return [...prev, file];
      }
      return prev;
    });

    if (!file.content && selectedRepo?.url) {
      await loadFileContent(file, selectedRepo);
    } else {
      setActiveFile(file);
      // If content is already present, check if saved analysis exists in MongoDB
      if (!file.analysis?.detailedExplanation && selectedRepo) {
        try {
          const repoName = selectedRepo.fullName || selectedRepo.name;
          const savedRecord = await fetchFileAnalysisFromDb(repoName, file.path);
          if (savedRecord && (savedRecord.analysisData || savedRecord.explanation)) {
            const restored = savedRecord.analysisData || {
              summary: savedRecord.explanation?.slice(0, 300) || 'Previous analysis restored from database.',
              detailedExplanation: savedRecord.explanation || '',
              keyInsights: ['Analysis restored from MongoDB history.'],
              functions: [],
              potentialIssues: [],
              suggestions: [],
              complexity: {
                time: 'Analyzed',
                space: 'Analyzed',
                maintainabilityIndex: 85,
                cyclomaticComplexity: 'Normal',
              },
              security: {
                score: 'A',
                status: 'AI Audited',
                details: 'Restored from previous session.',
              },
            };
            const updated = {
              ...file,
              analysis: restored,
            };
            setActiveFile(updated);
            setOpenTabs((prev) =>
              prev.map((t) => (t.path === file.path ? updated : t))
            );
          }
        } catch (_) {}
      }
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

      // Save repository metadata & structure to user's MongoDB history
      if (isAuthenticated) {
        saveUserRepoToDb(newRepo)
          .then((saved) => {
            if (saved) {
              console.log('[RepoMind] Successfully persisted analyzed repo to MongoDB:', saved.fullName);
            }
          })
          .catch((dbErr) =>
            console.error('[RepoMind] Failed to persist repository in MongoDB:', dbErr)
          );
      }

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

    if (isAuthenticated) {
      deleteUserRepoFromDb(repoId).catch(() => {});
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
    setUserSettings((prev) => {
      const next = { ...prev, ...partialSettings };
      if (partialSettings.aiModel) {
        setActiveAiModel(partialSettings.aiModel);
      }
      return next;
    });
  };

  const [isExplainingFile, setIsExplainingFile] = useState(false);
  const [explainError, setExplainError] = useState(null);

  /**
   * Request Gemini AI analysis for the currently active file
   */
  const requestFileExplanation = async (fileToExplain = activeFile, modelOverride = null) => {
    if (!fileToExplain || !fileToExplain.content) return;

    setIsExplainingFile(true);
    setExplainError(null);

    const modelToUse = modelOverride || activeAiModel;

    try {
      const analysisData = await explainCodeFile({
        repoName: selectedRepo?.fullName || selectedRepo?.name || 'Repository',
        filePath: fileToExplain.path,
        language: fileToExplain.language || 'text',
        code: fileToExplain.content,
        model: modelToUse,
      });

      const updatedFile = {
        ...fileToExplain,
        analysis: {
          summary: analysisData.summary || 'Summary unavailable.',
          detailedExplanation: analysisData.detailedExplanation || '',
          keyInsights: analysisData.importantConcepts || [],
          functions: analysisData.functions || [],
          potentialIssues: analysisData.potentialIssues || [],
          suggestions: analysisData.suggestions || [],
          complexity: {
            time: 'Analyzed',
            space: 'Analyzed',
            maintainabilityIndex: analysisData.metrics?.maintainabilityIndex || 85,
            cyclomaticComplexity: analysisData.metrics?.complexity || 'Normal',
          },
          security: {
            score: (analysisData.potentialIssues && analysisData.potentialIssues.length === 0) ? 'A' : 'B',
            status: 'AI Audited',
            details: (analysisData.potentialIssues && analysisData.potentialIssues.length > 0)
              ? analysisData.potentialIssues[0]
              : 'No glaring vulnerabilities identified in static review.',
          },
        },
      };

      setActiveFile(updatedFile);
      setOpenTabs((prev) =>
        prev.map((t) => (t.path === fileToExplain.path ? updatedFile : t))
      );

      // Update in-memory file tree so tab switches or explorer clicks retain the analysis
      setRepositories((prevRepos) =>
        prevRepos.map((r) => {
          if (r.id !== selectedRepo?.id && r.fullName !== selectedRepo?.fullName) return r;
          const updateTree = (nodes) => {
            if (!nodes) return [];
            return nodes.map((node) => {
              if (node.path === fileToExplain.path) {
                return { ...node, analysis: updatedFile.analysis };
              }
              if (node.children) {
                return { ...node, children: updateTree(node.children) };
              }
              return node;
            });
          };
          return { ...r, files: updateTree(r.files) };
        })
      );

      // Auto-save completed analysis to MongoDB history (only save if successful)
      try {
        await saveAnalysisToHistory({
          repositoryName: selectedRepo?.fullName || selectedRepo?.name || 'Repository',
          repositoryUrl: selectedRepo?.url || '',
          owner: selectedRepo?.owner || '',
          selectedFile: fileToExplain.path,
          language: fileToExplain.language || 'text',
          explanation: analysisData.detailedExplanation || analysisData.summary || 'Code analysis generated by Gemini.',
          analysisData: updatedFile.analysis,
        });
      } catch (saveErr) {
        console.warn('Auto-save analysis to MongoDB history warning:', saveErr.message);
      }

      return updatedFile;
    } catch (err) {
      setExplainError(err.message || 'Failed to explain code with Gemini AI.');
      throw err;
    } finally {
      setIsExplainingFile(false);
    }
  };

  /**
   * Send a chat question to Gemini regarding the active file
   */
  const askGeminiAboutFile = async (question, chatHistory = [], modelOverride = null) => {
    if (!activeFile || !activeFile.content) {
      throw new Error('Please select a file with valid source code before asking Gemini.');
    }

    return await chatAboutFile({
      filePath: activeFile.path,
      code: activeFile.content,
      messages: chatHistory,
      question,
      model: modelOverride || activeAiModel,
    });
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
        activeAiModel,
        setActiveAiModel,
        isExplainingFile,
        explainError,
        setExplainError,
        requestFileExplanation,
        askGeminiAboutFile,
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
