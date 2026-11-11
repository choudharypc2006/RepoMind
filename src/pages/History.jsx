import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Calendar,
  Code2,
  Trash2,
  ExternalLink,
  ArrowRight,
  RotateCcw,
  Star,
  GitFork,
  FileCode,
  ShieldCheck,
  FolderGit2,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';
import { useRepo } from '../context/RepoContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const History = () => {
  const navigate = useNavigate();
  const {
    repositories,
    deleteFromHistory,
    clearHistory,
    resetDefaultData,
    selectRepository,
    analyzeRepository,
  } = useRepo();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [reAnalyzingId, setReAnalyzingId] = useState(null);

  // Filter repositories
  const filteredRepositories = useMemo(() => {
    return repositories.filter((repo) => {
      const matchesSearch =
        repo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLang =
        selectedLanguage === 'ALL' || repo.primaryLanguage === selectedLanguage;
      return matchesSearch && matchesLang;
    });
  }, [repositories, searchTerm, selectedLanguage]);

  // Extract unique languages
  const languages = useMemo(() => {
    const set = new Set(repositories.map((r) => r.primaryLanguage));
    return ['ALL', ...Array.from(set)];
  }, [repositories]);

  const handleOpenRepo = (repoId) => {
    selectRepository(repoId);
    navigate(`/analysis/${repoId}`);
  };

  const handleReAnalyze = async (repo) => {
    setReAnalyzingId(repo.id);
    try {
      await analyzeRepository(repo.url);
    } catch (e) {
      // handled
    } finally {
      setReAnalyzingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 lg:px-12 max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-charcoal-700/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Analysis History
            </h1>
          </div>
          <p className="text-xs text-charcoal-400 mt-1">
            Review past repository audits, generated AST trees, and Gemini AI reports.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {repositories.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              icon={Trash2}
              className="hover:text-rose-400"
            >
              Clear History
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={resetDefaultData}
              icon={RotateCcw}
            >
              Restore Sample Data
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/')}
            icon={PlusCircle}
          >
            New Analysis
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-500" />
          <input
            type="text"
            placeholder="Search analyzed repositories by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-charcoal-900 border border-charcoal-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-charcoal-200 placeholder-charcoal-500 focus:outline-none focus:border-brand-500 font-mono"
          />
        </div>

        {/* Language Filter Pills */}
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
      </div>

      {/* Repositories List */}
      {filteredRepositories.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-charcoal-900 border border-dashed border-charcoal-700/70 space-y-3">
          <FolderGit2 className="w-12 h-12 text-charcoal-600 mx-auto" />
          <h3 className="text-base font-semibold text-charcoal-200">
            {repositories.length === 0 ? 'No repositories in history' : 'No matching repositories found'}
          </h3>
          <p className="text-xs text-charcoal-400 max-w-sm mx-auto">
            {repositories.length === 0
              ? 'You have not analyzed any repositories yet or history was cleared. Restore sample data or analyze a new repo!'
              : 'Try adjusting your search query or language filters to find what you are looking for.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            {repositories.length === 0 ? (
              <Button variant="secondary" size="sm" onClick={resetDefaultData} icon={RotateCcw}>
                Load Sample Repositories
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedLanguage('ALL');
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRepositories.map((repo) => (
            <div
              key={repo.id}
              className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-700/70 hover:border-charcoal-600 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Left Info */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <FolderGit2 className="w-4 h-4 text-brand-400 shrink-0" />
                  <span
                    onClick={() => handleOpenRepo(repo.id)}
                    className="font-semibold text-sm text-charcoal-100 hover:text-white cursor-pointer font-mono truncate"
                  >
                    {repo.fullName}
                  </span>
                  <Badge variant="cyan" size="xs">
                    {repo.primaryLanguage}
                  </Badge>
                  <span className="text-[11px] text-charcoal-500 font-mono hidden sm:inline">
                    Branch: {repo.defaultBranch}
                  </span>
                </div>

                <p className="text-xs text-charcoal-400 line-clamp-1 max-w-2xl">
                  {repo.description}
                </p>

                {/* Audit Tags */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-charcoal-400">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    {repo.stars.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5 text-charcoal-500" />
                    {repo.forks.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-brand-400" />
                    {repo.analysisStats?.totalFiles || 24} files
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Risk: {repo.analysisStats?.securityRisk || 'Low'}
                  </span>
                  <span className="text-charcoal-500 text-[11px]">
                    Analyzed: {new Date(repo.analyzedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReAnalyze(repo)}
                  isLoading={reAnalyzingId === repo.id}
                  icon={RotateCcw}
                  title="Re-run Gemini Analysis"
                >
                  Re-Analyze
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenRepo(repo.id)}
                  iconRight={ArrowRight}
                >
                  Open Report
                </Button>

                <button
                  onClick={() => deleteFromHistory(repo.id)}
                  className="p-2 rounded-lg text-charcoal-500 hover:text-rose-400 hover:bg-charcoal-800 transition-colors cursor-pointer"
                  title="Delete from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;

