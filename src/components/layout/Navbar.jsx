import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  ExternalLink,
  Github,
  ChevronRight,
  GitBranch,
  Sparkles,
  Command,
} from 'lucide-react';
import { useRepo } from '../../context/RepoContext';

export const Navbar = ({ onOpenSidebar, onOpenCommandPalette }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedRepo, activeFile } = useRepo();

  // Compute breadcrumbs
  const renderBreadcrumbs = () => {
    if (location.pathname === '/') {
      return (
        <span className="text-xs font-medium text-charcoal-300">
          Dashboard
        </span>
      );
    }
    if (location.pathname.startsWith('/analysis')) {
      return (
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => navigate('/')}
            className="text-charcoal-400 hover:text-charcoal-200 transition-colors"
          >
            Repositories
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-charcoal-600" />
          <span className="font-medium text-charcoal-200 font-mono">
            {selectedRepo ? selectedRepo.fullName : 'Analysis'}
          </span>
          {activeFile && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-charcoal-600" />
              <span className="text-brand-300 font-mono text-[11px] bg-charcoal-800 px-1.5 py-0.5 rounded border border-charcoal-700/60 truncate max-w-[200px]">
                {activeFile.name}
              </span>
            </>
          )}
        </div>
      );
    }
    if (location.pathname === '/history') {
      return (
        <span className="text-xs font-medium text-charcoal-300">
          Analysis History
        </span>
      );
    }
    if (location.pathname === '/settings') {
      return (
        <span className="text-xs font-medium text-charcoal-300">
          Settings & Preferences
        </span>
      );
    }
    return null;
  };

  return (
    <header className="h-14 bg-charcoal-900/90 backdrop-blur-md border-b border-charcoal-700/70 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden sm:flex items-center">
          {renderBreadcrumbs()}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* Quick Search Shortcut Display */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-charcoal-850 hover:bg-charcoal-800 border border-charcoal-700/60 text-xs text-charcoal-400 hover:text-charcoal-200 transition-all cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-charcoal-400" />
          <span>Quick Repo Search</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-charcoal-400 bg-charcoal-900 border border-charcoal-700 rounded">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>

        {/* Current repo GitHub link if in analysis */}
        {selectedRepo && location.pathname.startsWith('/analysis') && (
          <a
            href={selectedRepo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-charcoal-850 hover:bg-charcoal-800 border border-charcoal-700/60 text-xs font-medium text-charcoal-300 hover:text-charcoal-100 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GitHub</span>
            <ExternalLink className="w-3 h-3 text-charcoal-500" />
          </a>
        )}

        {/* Engine status indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono hidden sm:inline">Ready</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

