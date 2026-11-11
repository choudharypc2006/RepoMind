import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  GitBranch,
  ArrowRight,
  Star,
  GitFork,
  Clock,
  ShieldCheck,
  Code2,
  ExternalLink,
  Trash2,
  AlertCircle,
  FileCode,
  CheckCircle,
  FolderGit2,
  Zap,
} from 'lucide-react';
import { useRepo } from '../context/RepoContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { POPULAR_REPO_SUGGESTIONS } from '../data/mockRepositories';

export const Dashboard = () => {
  const navigate = useNavigate();
  const {
    repositories,
    analyzeRepository,
    isAnalyzing,
    analysisStep,
    analysisError,
    setAnalysisError,
    deleteFromHistory,
    selectRepository,
  } = useRepo();

  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setAnalysisError('Please enter a GitHub repository URL.');
      return;
    }

    try {
      const repoId = await analyzeRepository(inputUrl);
      navigate(`/analysis/${repoId}`);
    } catch (err) {
      // Error handled by context
    }
  };

  const handleSuggestionClick = (url) => {
    setInputUrl(url);
    setAnalysisError(null);
  };

  const handleOpenRepo = (repoId) => {
    selectRepository(repoId);
    navigate(`/analysis/${repoId}`);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 lg:px-12 max-w-7xl mx-auto w-full space-y-10">
      {/* Hero Welcome Section */}
      <section className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        {/* Modern Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-medium text-brand-300 shadow-glow-brand">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Next-Generation GitHub Repository Intelligence</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Understand any codebase{' '}
          <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-cyan-400 bg-clip-text text-transparent">
            in seconds
          </span>
        </h1>

        <p className="text-sm sm:text-base text-charcoal-400 max-w-xl mx-auto leading-relaxed">
          Enter any public GitHub repository to explore its folder architecture, inspect critical modules, and generate Gemini AI code explanations.
        </p>

        {/* Input Bar Form */}
        <div className="pt-4 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center bg-charcoal-900 border border-charcoal-700/80 rounded-xl p-1.5 shadow-2xl focus-within:border-brand-500/80 focus-within:ring-1 focus-within:ring-brand-500/50 transition-all">
              <div className="pl-3 text-charcoal-500">
                <FolderGit2 className="w-5 h-5" />
              </div>

              <input
                type="text"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  if (analysisError) setAnalysisError(null);
                }}
                placeholder="https://github.com/owner/repository"
                disabled={isAnalyzing}
                className="w-full bg-transparent px-3 py-2 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none font-mono"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isAnalyzing}
                icon={Sparkles}
                className="shrink-0 rounded-lg shadow-glow-brand"
              >
                Analyze Repository
              </Button>
            </div>

            {/* Error Message */}
            {analysisError && (
              <div className="mt-3 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Analyzing Progress Steps */}
            {isAnalyzing && (
              <div className="mt-4 p-4 rounded-xl bg-charcoal-900 border border-brand-500/30 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-brand-300 font-medium">
                    <Sparkles className="w-4 h-4 text-brand-400 animate-spin" />
                    <span>{analysisStep}</span>
                  </div>
                  <span className="text-[11px] font-mono text-charcoal-400">Processing AST</span>
                </div>
                {/* Progress bar shimmer */}
                <div className="w-full h-1.5 bg-charcoal-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 animate-pulse w-3/4 rounded-full" />
                </div>
              </div>
            )}
          </form>

          {/* Quick Suggestions Chips */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-charcoal-500">
            <span className="text-charcoal-500 text-[11px]">Try sample:</span>
            {POPULAR_REPO_SUGGESTIONS.map((sugg) => (
              <button
                key={sugg.label}
                type="button"
                onClick={() => handleSuggestionClick(sugg.url)}
                className="px-2.5 py-1 rounded-md bg-charcoal-850 hover:bg-charcoal-800 text-charcoal-300 hover:text-brand-300 border border-charcoal-700/60 font-mono text-[11px] transition-colors cursor-pointer"
              >
                {sugg.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Feature / Stats Highlights */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
        <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-charcoal-400">Repositories Indexed</span>
            <Code2 className="w-4 h-4 text-brand-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono">{repositories.length}</span>
            <span className="text-[11px] text-emerald-400 ml-1.5">Live cache</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-charcoal-400">AST Files Scanned</span>
            <FileCode className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono">1,420+</span>
            <span className="text-[11px] text-charcoal-400 ml-1.5">Parsed</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-charcoal-400">AI Intelligence Model</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-base font-bold text-white font-mono">Gemini 1.5</span>
            <span className="text-[11px] text-brand-400 ml-1.5">High Precision</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-charcoal-400">Security Scans</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono">100%</span>
            <span className="text-[11px] text-emerald-400 ml-1.5">Zero CVEs</span>
          </div>
        </div>
      </section>

      {/* Recent Repositories Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              Recently Analyzed Repositories
            </h2>
            <p className="text-xs text-charcoal-400">
              Browse previously indexed repositories or run a fresh deep-dive analysis.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/history')}
            iconRight={ArrowRight}
          >
            View Full History
          </Button>
        </div>

        {repositories.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-charcoal-900 border border-dashed border-charcoal-700/70">
            <FolderGit2 className="w-10 h-10 text-charcoal-500 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-charcoal-200">No repositories analyzed yet</h3>
            <p className="text-xs text-charcoal-400 mt-1 max-w-sm mx-auto">
              Enter any public GitHub URL in the input above to begin code inspection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="group p-5 rounded-xl bg-charcoal-900 border border-charcoal-700/70 hover:border-charcoal-600 hover:bg-charcoal-850/90 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-brand-400 shrink-0" />
                      <h3
                        onClick={() => handleOpenRepo(repo.id)}
                        className="font-semibold text-sm text-charcoal-100 hover:text-white cursor-pointer font-mono truncate"
                      >
                        {repo.fullName}
                      </h3>
                    </div>
                    <p className="text-xs text-charcoal-400 line-clamp-2 leading-relaxed">
                      {repo.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-300 hover:bg-charcoal-800 transition-colors"
                      title="Open on GitHub"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => deleteFromHistory(repo.id)}
                      className="p-1.5 rounded-lg text-charcoal-500 hover:text-rose-400 hover:bg-charcoal-800 transition-colors cursor-pointer"
                      title="Remove from list"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="mt-4 pt-3 border-t border-charcoal-800 flex items-center justify-between text-xs text-charcoal-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {repo.primaryLanguage}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      {repo.stars.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5 text-charcoal-500" />
                      {repo.forks.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenRepo(repo.id)}
                    className="flex items-center gap-1 text-xs font-medium text-brand-400 group-hover:text-brand-300 transition-colors cursor-pointer"
                  >
                    <span>Inspect Code</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;

