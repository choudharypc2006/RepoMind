import React, { useState, useRef, useEffect } from 'react';
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
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import { useRepo } from '../../context/RepoContext';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ onOpenSidebar, onOpenCommandPalette }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedRepo, activeFile } = useRepo();
  const { user, logoutUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logoutUser();
    navigate('/login');
  };

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
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-charcoal-850 border border-charcoal-700/60 text-xs text-charcoal-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-[11px] font-mono hidden sm:inline">Ready</span>
        </div>

        {/* User dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-charcoal-850 hover:bg-charcoal-800 border border-charcoal-700/60 text-xs text-charcoal-300 hover:text-charcoal-100 transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
              </div>
              <span className="hidden sm:inline font-medium max-w-[100px] truncate">{user.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-charcoal-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-charcoal-900 border border-charcoal-700/60 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                <div className="px-3.5 py-2.5 border-b border-charcoal-700/60">
                  <p className="text-xs font-semibold text-charcoal-100 truncate">{user.name}</p>
                  <p className="text-[11px] text-charcoal-500 truncate mt-0.5">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-charcoal-300 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

