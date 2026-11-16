import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  GitBranch,
  Star,
  GitFork,
  ExternalLink,
  Trash2,
  AlertCircle,
  FileCode2,
  ShieldCheck,
  Search,
  Cpu,
  Layers,
  TerminalSquare,
  Workflow,
  CheckCircle2,
} from 'lucide-react';
import { useRepo } from '../context/RepoContext';
import { Button } from '../components/common/Button';
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
    userSettings,
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
    if (analysisError) setAnalysisError(null);
  };

  const handleOpenRepo = (repoId) => {
    selectRepository(repoId);
    navigate(`/analysis/${repoId}`);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-10 lg:px-12 max-w-6xl mx-auto w-full space-y-12">
      {/* Hero Ingestion Section */}
      <section className="max-w-3xl mx-auto space-y-5 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          Inspect repository architecture and analyze code
        </h1>

        <p className="text-sm sm:text-base text-charcoal-400 max-w-xl mx-auto leading-relaxed">
          Traverse recursive directory trees, inspect critical modules, and generate structured code explanations grounded in the source.
        </p>

        {/* Input Bar Form */}
        <div className="pt-2 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center bg-charcoal-900 border border-charcoal-700 rounded-xl p-1.5 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/30 transition-colors">
              <div className="pl-3.5 pr-1 text-charcoal-500">
                <GitBranch className="w-4 h-4" />
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
                className="w-full bg-transparent px-2.5 py-2 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none font-mono"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isAnalyzing}
                icon={Search}
                className="shrink-0 rounded-lg text-xs font-medium"
              >
                Inspect repository
              </Button>
            </div>

            {/* Error Message */}
            {analysisError && (
              <div className="mt-3 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Ingestion Progress */}
            {isAnalyzing && (
              <div className="mt-4 p-4 rounded-xl bg-charcoal-900 border border-brand-500/40 text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-brand-300 font-medium">
                    <Workflow className="w-4 h-4 text-brand-400 animate-spin" />
                    <span>{analysisStep}</span>
                  </div>
                  <span className="text-[11px] font-mono text-charcoal-400">Git Trees API</span>
                </div>
                <div className="w-full h-1 bg-charcoal-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 w-3/4 rounded-full transition-all duration-300" />
                </div>
              </div>
            )}
          </form>

          {/* Quick Suggestions Chips */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs text-charcoal-500">
            <span className="text-[11px] text-charcoal-500">Sample repositories:</span>
            {POPULAR_REPO_SUGGESTIONS.map((sugg) => (
              <button
                key={sugg.label}
                type="button"
                onClick={() => handleSuggestionClick(sugg.url)}
                className="px-2.5 py-0.5 rounded-md bg-charcoal-900 hover:bg-charcoal-800 text-charcoal-300 hover:text-charcoal-100 border border-charcoal-700/70 font-mono text-[11px] transition-colors cursor-pointer"
              >
                {sugg.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-700/60 flex flex-col justify-between space-y-3">
          <div className="w-8 h-8 rounded-lg bg-charcoal-800 border border-charcoal-700 flex items-center justify-center text-charcoal-300">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-charcoal-100">Tree navigation</h2>
            <p className="text-xs text-charcoal-400 mt-1 leading-relaxed">
              Full recursive folder trees with syntax-aware filtering, file size badges, and multi-tab code viewing.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-700/60 flex flex-col justify-between space-y-3">
          <div className="w-8 h-8 rounded-lg bg-charcoal-800 border border-charcoal-700 flex items-center justify-center text-charcoal-300">
            <FileCode2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-charcoal-100">Structural breakdown</h2>
            <p className="text-xs text-charcoal-400 mt-1 leading-relaxed">
              Executive summaries, component roles, design patterns, and exported function documentation.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-700/60 flex flex-col justify-between space-y-3">
          <div className="w-8 h-8 rounded-lg bg-charcoal-800 border border-charcoal-700 flex items-center justify-center text-charcoal-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-charcoal-100">Logic & audit analysis</h2>
            <p className="text-xs text-charcoal-400 mt-1 leading-relaxed">
              Identifies potential race conditions, edge case exceptions, and missing guards without hallucinations.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Repositories Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-charcoal-800 pb-3">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Analyzed repositories
            </h2>
            <p className="text-xs text-charcoal-400 mt-0.5">
              Previously inspected codebases cached for immediate browsing.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/history')}
            className="text-xs"
          >
            Full history
          </Button>
        </div>

        {repositories.length === 0 ? (
          <div className="p-10 text-center rounded-xl bg-charcoal-900 border border-dashed border-charcoal-800">
            <FolderGit2 className="w-8 h-8 text-charcoal-600 mx-auto mb-2.5" />
            <h3 className="text-xs font-semibold text-charcoal-300">No repositories analyzed yet</h3>
            <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto">
              Enter any public GitHub URL in the prompt above to inspect its architecture.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-700/70 hover:border-charcoal-600 transition-colors flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-brand-400 shrink-0" />
                      <button
                        onClick={() => handleOpenRepo(repo.id)}
                        className="font-mono text-xs font-semibold text-charcoal-100 hover:text-white truncate text-left cursor-pointer"
                      >
                        {repo.fullName}
                      </button>
                    </div>
                    {repo.description && (
                      <p className="text-xs text-charcoal-400 line-clamp-2 leading-relaxed">
                        {repo.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded text-charcoal-500 hover:text-charcoal-300 transition-colors"
                      title="Open on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => deleteFromHistory(repo.id)}
                      className="p-1.5 rounded text-charcoal-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="mt-4 pt-3 border-t border-charcoal-800 flex items-center justify-between text-xs text-charcoal-400">
                  <div className="flex items-center gap-3">
                    {repo.primaryLanguage && (
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {repo.primaryLanguage}
                      </span>
                    )}
                    {typeof repo.stars === 'number' && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Star className="w-3 h-3 text-amber-400" />
                        {repo.stars.toLocaleString()}
                      </span>
                    )}
                    {typeof repo.forks === 'number' && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <GitFork className="w-3 h-3 text-charcoal-500" />
                        {repo.forks.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenRepo(repo.id)}
                    className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
                  >
                    Open in workspace
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
