import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History as HistoryIcon,
  Search,
  Calendar,
  Code2,
  Trash2,
  ExternalLink,
  RotateCcw,
  FileCode,
  FolderGit2,
  PlusCircle,
  Eye,
  Loader2,
  AlertCircle,
  Check,
  Copy,
  X,
  Sparkles,
  ArrowRight,
  Star,
  GitFork,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useRepo } from '../context/RepoContext';
import {
  fetchAnalysisHistory,
  deleteAnalysisById,
  fetchUserReposFromDb,
  deleteUserRepoFromDb,
} from '../services/githubApi';

export const History = () => {
  const navigate = useNavigate();
  const { selectRepository } = useRepo();

  const [activeTab, setActiveTab] = useState('repositories'); // 'repositories' | 'explanations'
  const [userRepos, setUserRepos] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');

  // Modal for Viewing Single Code Analysis
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load history from MongoDB on mount
  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reposData, analysesData] = await Promise.all([
        fetchUserReposFromDb().catch(() => []),
        fetchAnalysisHistory().catch(() => []),
      ]);
      setUserRepos(reposData || []);
      setAnalyses(analysesData || []);
    } catch (err) {
      setError(err.message || 'Failed to load analysis history from MongoDB.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Delete a saved repository
  const handleDeleteRepo = async (repoId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this analyzed repository from your MongoDB history?')) {
      return;
    }

    setDeletingId(repoId);
    try {
      await deleteUserRepoFromDb(repoId);
      setUserRepos((prev) => prev.filter((r) => r.id !== repoId && r.repoId !== repoId));
    } catch (err) {
      alert('Failed to delete repository from history.');
    } finally {
      setDeletingId(null);
    }
  };

  // Delete an AI code file analysis
  const handleDeleteAnalysis = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this code explanation from your MongoDB history?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteAnalysisById(id);
      setAnalyses((prev) => prev.filter((item) => item._id !== id));
      if (selectedAnalysis?._id === id) {
        setSelectedAnalysis(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete analysis.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenRepo = (repoId) => {
    selectRepository(repoId);
    navigate(`/analysis/${repoId}`);
  };

  const handleOpenAnalysisWorkspace = (item, e) => {
    if (e) e.stopPropagation();
    selectRepository(item.repositoryName, item.selectedFile);
    navigate(`/analysis/${item.repositoryName}?file=${encodeURIComponent(item.selectedFile)}`);
  };

  // Filter repositories
  const filteredRepos = useMemo(() => {
    return userRepos.filter((item) => {
      const name = item.fullName?.toLowerCase() || item.name?.toLowerCase() || '';
      const desc = item.description?.toLowerCase() || '';
      const query = searchTerm.toLowerCase();

      const matchesSearch = name.includes(query) || desc.includes(query);
      const matchesLang =
        selectedLanguage === 'ALL' ||
        item.primaryLanguage?.toUpperCase() === selectedLanguage.toUpperCase();

      return matchesSearch && matchesLang;
    });
  }, [userRepos, searchTerm, selectedLanguage]);

  // Filter code file analyses
  const filteredAnalyses = useMemo(() => {
    return analyses.filter((item) => {
      const repo = item.repositoryName?.toLowerCase() || '';
      const file = item.selectedFile?.toLowerCase() || '';
      const exp = item.explanation?.toLowerCase() || '';
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        repo.includes(query) || file.includes(query) || exp.includes(query);
      const matchesLang =
        selectedLanguage === 'ALL' ||
        item.language?.toUpperCase() === selectedLanguage.toUpperCase();

      return matchesSearch && matchesLang;
    });
  }, [analyses, searchTerm, selectedLanguage]);

  // Extract unique languages for active tab
  const languages = useMemo(() => {
    const list =
      activeTab === 'repositories'
        ? userRepos.map((r) => r.primaryLanguage?.toUpperCase())
        : analyses.map((a) => a.language?.toUpperCase());
    const set = new Set(list.filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [activeTab, userRepos, analyses]);

  const handleCopyExplanation = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 lg:px-12 max-w-7xl mx-auto w-full space-y-8 select-text">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-charcoal-700/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Analysis history
            </h1>
          </div>
          <p className="text-xs text-charcoal-400 mt-1">
            Inspected repositories and saved code explanations associated with your account.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            icon={RotateCcw}
            isLoading={isLoading}
            title="Refresh history"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/')}
            icon={PlusCircle}
          >
            New analysis
          </Button>
        </div>
      </div>

      {/* Tabs Switcher: Repositories vs Code Explanations */}
      <div className="flex items-center gap-2 border-b border-charcoal-700/80 pb-3">
        <button
          onClick={() => {
            setActiveTab('repositories');
            setSelectedLanguage('ALL');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'repositories'
              ? 'bg-charcoal-800 text-charcoal-100 border border-charcoal-700'
              : 'text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-900 border border-transparent'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>Analyzed repositories</span>
          <span className="ml-1 px-1.5 py-0.2 rounded bg-charcoal-850 text-[10px] font-mono text-charcoal-400">
            {userRepos.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('explanations');
            setSelectedLanguage('ALL');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'explanations'
              ? 'bg-charcoal-800 text-charcoal-100 border border-charcoal-700'
              : 'text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-900 border border-transparent'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Saved explanations</span>
          <span className="ml-1 px-1.5 py-0.2 rounded bg-charcoal-850 text-[10px] font-mono text-charcoal-400">
            {analyses.length}
          </span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="xs" onClick={loadHistory}>
            Try Again
          </Button>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-500" />
          <input
            type="text"
            placeholder={
              activeTab === 'repositories'
                ? 'Search analyzed repositories by name or description...'
                : 'Search by repo, file path, or AI explanation...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-charcoal-900 border border-charcoal-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-charcoal-200 placeholder-charcoal-500 focus:outline-none focus:border-brand-500 font-mono"
          />
        </div>

        {/* Language Filter Pills */}
        {languages.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] text-charcoal-500 uppercase tracking-wider font-semibold mr-1">
              Language:
            </span>
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                  selectedLanguage === lang
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                    : 'bg-charcoal-900 text-charcoal-400 hover:text-charcoal-200 border border-charcoal-700/60'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-800 animate-pulse space-y-3"
            >
              <div className="h-4 bg-charcoal-800 rounded w-1/3"></div>
              <div className="h-3 bg-charcoal-800/60 rounded w-1/2"></div>
              <div className="h-3 bg-charcoal-800/40 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      ) : activeTab === 'repositories' ? (
        /* ─── TAB 1: ANALYZED REPOSITORIES ─── */
        filteredRepos.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-charcoal-900 border border-dashed border-charcoal-700/70 space-y-3">
            <FolderGit2 className="w-12 h-12 text-charcoal-600 mx-auto" />
            <h3 className="text-base font-semibold text-charcoal-200">
              {userRepos.length === 0 ? 'No repositories analyzed in MongoDB yet' : 'No matching repositories found'}
            </h3>
            <p className="text-xs text-charcoal-400 max-w-md mx-auto">
              {userRepos.length === 0
                ? 'Enter any GitHub URL on the Dashboard and click "Analyze Repository". It will be permanently stored in your MongoDB account!'
                : 'Try adjusting your search query or language filter.'}
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/')}
                icon={PlusCircle}
              >
                Analyze a Repository Now
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRepos.map((repo) => (
              <div
                key={repo.id || repo._id}
                className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-700/70 hover:border-brand-500/50 hover:bg-charcoal-850/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group shadow-sm"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <FolderGit2 className="w-4 h-4 text-brand-400 shrink-0" />
                    <span
                      onClick={() => handleOpenRepo(repo.id)}
                      className="font-semibold text-sm text-charcoal-100 hover:text-white cursor-pointer font-mono truncate"
                    >
                      {repo.fullName}
                    </span>
                    <Badge variant="cyan" size="xs">
                      {repo.primaryLanguage || 'JavaScript'}
                    </Badge>
                    <span className="text-[11px] text-charcoal-500 font-mono hidden sm:inline">
                      Branch: {repo.defaultBranch || 'main'}
                    </span>
                  </div>

                  <p className="text-xs text-charcoal-400 line-clamp-2 max-w-2xl leading-relaxed">
                    {repo.description || 'Public GitHub repository analyzed via RepoMind.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-charcoal-400">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      {(repo.stars || 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5 text-charcoal-500" />
                      {(repo.forks || 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileCode className="w-3.5 h-3.5 text-brand-400" />
                      {repo.analysisStats?.totalFiles || 0} files
                    </span>
                    <span className="text-charcoal-500 text-[11px]">
                      Analyzed:{' '}
                      {new Date(repo.analyzedAt || repo.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenRepo(repo.id)}
                  >
                    Open workspace
                  </Button>

                  <button
                    onClick={(e) => handleDeleteRepo(repo.id, e)}
                    disabled={deletingId === repo.id}
                    className="p-2 rounded-lg text-charcoal-500 hover:text-rose-400 hover:bg-charcoal-800 transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete from MongoDB"
                  >
                    {deletingId === repo.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ─── TAB 2: CODE FILE EXPLANATIONS ─── */
        filteredAnalyses.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-charcoal-900 border border-dashed border-charcoal-700/70 space-y-3">
            <FileCode className="w-12 h-12 text-charcoal-600 mx-auto" />
            <h3 className="text-base font-semibold text-charcoal-200">
              {analyses.length === 0 ? 'No code file explanations saved yet' : 'No matching explanations found'}
            </h3>
            <p className="text-xs text-charcoal-400 max-w-md mx-auto">
              {analyses.length === 0
                ? 'Whenever you click "Explain Code" on a file in the Repository Analysis panel, Gemini automatically persists the explanation to your MongoDB account.'
                : 'Try adjusting your search query or language filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnalyses.map((item) => (
              <div
                key={item._id}
                onClick={() => setSelectedAnalysis(item)}
                className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-700/70 hover:border-brand-500/50 hover:bg-charcoal-850/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group shadow-sm"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="font-semibold text-sm text-charcoal-100 font-mono truncate">
                      {item.repositoryName}
                    </span>

                    <Badge variant="cyan" size="xs">
                      {item.language || 'text'}
                    </Badge>

                    {item.repositoryUrl && (
                      <a
                        href={item.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] text-charcoal-400 hover:text-brand-300 font-mono transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        GitHub
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-charcoal-300 font-mono">
                    <FileCode className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span className="text-brand-300 bg-charcoal-800/80 px-2 py-0.5 rounded border border-charcoal-700/60 truncate max-w-md">
                      {item.selectedFile}
                    </span>
                  </div>

                  <p className="text-xs text-charcoal-400 line-clamp-2 leading-relaxed">
                    {item.explanation}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-charcoal-500 pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Analyzed on{' '}
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnalysis(item);
                    }}
                    icon={Eye}
                  >
                    View Details
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => handleOpenAnalysisWorkspace(item, e)}
                    iconRight={ArrowRight}
                  >
                    Open Workspace
                  </Button>

                  <button
                    onClick={(e) => handleDeleteAnalysis(item._id, e)}
                    disabled={deletingId === item._id}
                    className="p-2 rounded-lg text-charcoal-500 hover:text-rose-400 hover:bg-charcoal-800 transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete from history"
                  >
                    {deletingId === item._id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Analysis Detail Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-charcoal-700/80 flex items-center justify-between bg-charcoal-850">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-charcoal-100 font-mono">
                    {selectedAnalysis.repositoryName}
                  </h3>
                  <p className="text-[11px] text-brand-300 font-mono truncate max-w-md">
                    {selectedAnalysis.selectedFile}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyExplanation(selectedAnalysis.explanation)}
                  className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-100 hover:bg-charcoal-800 transition-colors"
                  title="Copy explanation"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-100 hover:bg-charcoal-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-5 py-2.5 bg-charcoal-950/60 border-b border-charcoal-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="cyan" size="xs">
                  {selectedAnalysis.language || 'text'}
                </Badge>
                {selectedAnalysis.repositoryUrl && (
                  <a
                    href={selectedAnalysis.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-charcoal-400 hover:text-brand-300 transition-colors font-mono"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open on GitHub
                  </a>
                )}
              </div>
              <span className="text-charcoal-500 text-[11px]">
                Analyzed on {new Date(selectedAnalysis.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-charcoal-200">
              <div className="p-4 rounded-xl bg-charcoal-850 border border-charcoal-700/60 whitespace-pre-line font-sans">
                {selectedAnalysis.explanation}
              </div>
            </div>

            <div className="p-4 border-t border-charcoal-700/80 bg-charcoal-850 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleDeleteAnalysis(selectedAnalysis._id, e)}
                icon={Trash2}
                className="text-rose-400 hover:text-rose-300 border-rose-500/20 hover:bg-rose-500/10"
              >
                Delete Analysis
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAnalysis(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenAnalysisWorkspace(selectedAnalysis)}
                  iconRight={ArrowRight}
                >
                  Open in Workspace
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
