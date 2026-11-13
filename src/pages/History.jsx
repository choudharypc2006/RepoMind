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
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { fetchAnalysisHistory, deleteAnalysisById } from '../services/githubApi';

export const History = () => {
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');

  // Modal for Viewing Single Analysis
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load history from MongoDB on mount
  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAnalysisHistory();
      setAnalyses(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load analysis history from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Delete an analysis
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this analysis from history?')) {
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

  // Filter analyses
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

  // Extract unique languages
  const languages = useMemo(() => {
    const set = new Set(
      analyses
        .map((a) => a.language?.toUpperCase())
        .filter(Boolean)
    );
    return ['ALL', ...Array.from(set)];
  }, [analyses]);

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
              Repository Analysis History
            </h1>
          </div>
          <p className="text-xs text-charcoal-400 mt-1">
            Persistent audit history saved in MongoDB. Review Gemini AI explanations, file audits, and architectural breakdowns.
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
            title="Refresh history from MongoDB"
          >
            Refresh
          </Button>

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
            placeholder="Search by repo, file path, or AI explanation..."
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

      {/* Loading State */}
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
      ) : filteredAnalyses.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-charcoal-900 border border-dashed border-charcoal-700/70 space-y-3">
          <FolderGit2 className="w-12 h-12 text-charcoal-600 mx-auto" />
          <h3 className="text-base font-semibold text-charcoal-200">
            {analyses.length === 0 ? 'No analyses recorded in MongoDB' : 'No matching analyses found'}
          </h3>
          <p className="text-xs text-charcoal-400 max-w-md mx-auto">
            {analyses.length === 0
              ? 'Whenever you click "Explain Code" on a file in the Repository Analysis page, Gemini reviews the code and automatically records it into your MongoDB account.'
              : 'Try adjusting your search query or language filter to locate past analysis records.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            {analyses.length === 0 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/')}
                icon={PlusCircle}
              >
                Analyze a Repository Now
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
                Reset Search Filters
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Analyses List */
        <div className="space-y-3">
          {filteredAnalyses.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelectedAnalysis(item)}
              className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-700/70 hover:border-brand-500/50 hover:bg-charcoal-850/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group shadow-sm"
            >
              {/* Left Details */}
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
                      title="Open GitHub repository"
                    >
                      <ExternalLink className="w-3 h-3" />
                      GitHub
                    </a>
                  )}
                </div>

                {/* File Path Indicator */}
                <div className="flex items-center gap-1.5 text-xs text-charcoal-300 font-mono">
                  <FileCode className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span className="text-brand-300 bg-charcoal-800/80 px-2 py-0.5 rounded border border-charcoal-700/60 truncate max-w-md">
                    {item.selectedFile}
                  </span>
                </div>

                {/* Explanation Snippet */}
                <p className="text-xs text-charcoal-400 line-clamp-2 leading-relaxed">
                  {item.explanation}
                </p>

                {/* Timestamp */}
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

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnalysis(item);
                  }}
                  icon={Eye}
                >
                  View Details
                </Button>

                <button
                  onClick={(e) => handleDelete(item._id, e)}
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
      )}

      {/* Analysis Detail Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
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

            {/* Modal Subheader Meta */}
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-charcoal-200">
              <div className="p-4 rounded-xl bg-charcoal-850 border border-charcoal-700/60 whitespace-pre-line font-sans">
                {selectedAnalysis.explanation}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-charcoal-700/80 bg-charcoal-850 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleDelete(selectedAnalysis._id, e)}
                icon={Trash2}
                className="text-rose-400 hover:text-rose-300 border-rose-500/20 hover:bg-rose-500/10"
              >
                Delete Analysis
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedAnalysis(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
