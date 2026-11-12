import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Github,
  ExternalLink,
  Star,
  GitFork,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Code2,
  Layers,
  Bot,
  RefreshCw,
  FolderGit2,
} from 'lucide-react';
import { useRepo } from '../context/RepoContext';
import FileTree from '../components/analysis/FileTree';
import CodeViewer from '../components/analysis/CodeViewer';
import AIAnalysisPanel from '../components/analysis/AIAnalysisPanel';
import { Badge } from '../components/common/Badge';

export const RepositoryAnalysis = () => {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const {
    repositories,
    selectedRepo,
    selectedRepoId,
    selectRepository,
    activeFile,
    selectFile,
    openTabs,
    closeTab,
    isLoadingFile,
    isExplainingFile,
    requestFileExplanation,
    explainError,
  } = useRepo();

  // Responsive mobile active view: 'files' | 'code' | 'ai'
  const [mobileTab, setMobileTab] = useState('code');
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Sync route params with selected repo
  useEffect(() => {
    if (repoId && repoId !== selectedRepoId) {
      selectRepository(repoId);
    }
  }, [repoId]);

  const handleExplainCode = async () => {
    if (window.innerWidth < 1024) {
      setMobileTab('ai');
    }
    try {
      await requestFileExplanation(activeFile);
    } catch (err) {
      // Error state captured in context / panel
    }
  };

  const handleSelectFile = (file) => {
    selectFile(file);
    if (window.innerWidth < 1024) {
      setMobileTab('code');
    }
  };

  if (!selectedRepo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <FolderGit2 className="w-12 h-12 text-charcoal-600 mb-3" />
        <h2 className="text-base font-semibold text-charcoal-200">Repository Not Found</h2>
        <p className="text-xs text-charcoal-400 mt-1 max-w-sm">
          The requested repository could not be found or has not been analyzed yet.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Top Repository Context Bar */}
      <div className="h-12 bg-charcoal-900 border-b border-charcoal-700/70 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Left panel collapse toggle */}
          <button
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className="hidden lg:flex p-1.5 rounded text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800 transition-colors"
            title={showLeftPanel ? 'Hide File Explorer' : 'Show File Explorer'}
          >
            {showLeftPanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          {/* Repo Full Name */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono font-semibold text-xs sm:text-sm text-charcoal-100 truncate">
              {selectedRepo.fullName}
            </span>

            {/* Branch pill */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-charcoal-800 border border-charcoal-700 text-[11px] text-charcoal-300 font-mono">
              <GitBranch className="w-3 h-3 text-brand-400" />
              <span>{selectedRepo.defaultBranch}</span>
            </div>

            <Badge variant="cyan" size="xs">
              {selectedRepo.primaryLanguage}
            </Badge>
          </div>
        </div>

        {/* Center / Right quick metrics and panel toggles */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-3 text-xs text-charcoal-400">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              {selectedRepo.stars.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5 text-charcoal-500" />
              {selectedRepo.forks.toLocaleString()}
            </span>
          </div>

          <a
            href={selectedRepo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-charcoal-800 hover:bg-charcoal-750 border border-charcoal-700 text-xs font-mono text-charcoal-300 hover:text-white transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Source</span>
            <ExternalLink className="w-3 h-3 text-charcoal-500" />
          </a>

          {/* Right panel collapse toggle */}
          <button
            onClick={() => setShowRightPanel(!showRightPanel)}
            className="hidden lg:flex p-1.5 rounded text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800 transition-colors"
            title={showRightPanel ? 'Hide Gemini AI Panel' : 'Show Gemini AI Panel'}
          >
            {showRightPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex border-b border-charcoal-700/80 bg-charcoal-900 text-xs font-medium shrink-0">
        <button
          onClick={() => setMobileTab('files')}
          className={`flex-1 py-2 text-center border-b-2 flex items-center justify-center gap-1.5 ${
            mobileTab === 'files'
              ? 'border-brand-500 text-brand-300 bg-charcoal-850'
              : 'border-transparent text-charcoal-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Files</span>
        </button>
        <button
          onClick={() => setMobileTab('code')}
          className={`flex-1 py-2 text-center border-b-2 flex items-center justify-center gap-1.5 ${
            mobileTab === 'code'
              ? 'border-brand-500 text-brand-300 bg-charcoal-850'
              : 'border-transparent text-charcoal-400'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Code Viewer</span>
        </button>
        <button
          onClick={() => setMobileTab('ai')}
          className={`flex-1 py-2 text-center border-b-2 flex items-center justify-center gap-1.5 ${
            mobileTab === 'ai'
              ? 'border-brand-500 text-brand-300 bg-charcoal-850'
              : 'border-transparent text-charcoal-400'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Gemini AI</span>
        </button>
      </div>

      {/* Three-Panel Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: File Explorer */}
        <div
          className={`${
            showLeftPanel ? 'w-64 xl:w-72' : 'w-0 hidden'
          } shrink-0 h-full border-r border-charcoal-700/70 transition-all duration-150 ${
            mobileTab === 'files' ? 'flex w-full absolute inset-0 z-20 bg-charcoal-900' : 'hidden lg:flex'
          }`}
        >
          <div className="w-full h-full">
            <FileTree
              files={selectedRepo.files || []}
              activeFile={activeFile}
              onSelectFile={handleSelectFile}
            />
          </div>
        </div>

        {/* Center Panel: Code Viewer */}
        <div
          className={`flex-1 flex flex-col h-full min-w-0 ${
            mobileTab === 'code' ? 'flex w-full' : 'hidden lg:flex'
          }`}
        >
          <CodeViewer
            file={activeFile}
            openTabs={openTabs}
            onSelectTab={selectFile}
            onCloseTab={closeTab}
            onExplainCode={handleExplainCode}
            isExplaining={isExplainingFile}
            isLoadingFile={isLoadingFile}
          />
        </div>

        {/* Right Panel: AI Analysis Panel */}
        <div
          className={`${
            showRightPanel ? 'w-80 xl:w-96' : 'w-0 hidden'
          } shrink-0 h-full border-l border-charcoal-700/70 transition-all duration-150 ${
            mobileTab === 'ai' ? 'flex w-full absolute inset-0 z-20 bg-charcoal-900' : 'hidden lg:flex'
          }`}
        >
          <div className="w-full h-full">
            <AIAnalysisPanel
              file={activeFile}
              isAnalyzing={isExplainingFile}
              explainError={explainError}
              onTriggerExplain={handleExplainCode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepositoryAnalysis;

