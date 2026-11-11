import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Command,
  FileCode,
  FolderGit2,
  Sparkles,
  History,
  Settings,
  ArrowRight,
  CornerDownLeft,
  X,
} from 'lucide-react';
import { useRepo } from '../../context/RepoContext';

export const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { repositories, selectedRepo, selectRepository, selectFile } = useRepo();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K and Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open
          const event = new CustomEvent('open-command-palette');
          window.dispatchEvent(event);
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Collect searchable items
  const items = React.useMemo(() => {
    const list = [];

    // Navigation actions
    list.push({
      id: 'nav-dashboard',
      type: 'action',
      title: 'Go to Dashboard',
      subtitle: 'Analyze new repositories and view overview',
      icon: FolderGit2,
      onSelect: () => navigate('/'),
    });

    list.push({
      id: 'nav-history',
      type: 'action',
      title: 'Go to Analysis History',
      subtitle: 'View previously audited repositories',
      icon: History,
      onSelect: () => navigate('/history'),
    });

    list.push({
      id: 'nav-settings',
      type: 'action',
      title: 'Go to Settings',
      subtitle: 'Customize Gemini models, theme & font size',
      icon: Settings,
      onSelect: () => navigate('/settings'),
    });

    // Repositories
    repositories.forEach((repo) => {
      list.push({
        id: `repo-${repo.id}`,
        type: 'repo',
        title: repo.fullName,
        subtitle: `${repo.primaryLanguage} • ${repo.stars.toLocaleString()} stars`,
        icon: FolderGit2,
        onSelect: () => {
          selectRepository(repo.id);
          navigate(`/analysis/${repo.id}`);
        },
      });
    });

    // Files in active repo
    if (selectedRepo?.files) {
      const collectFiles = (nodes) => {
        nodes.forEach((node) => {
          if (node.type === 'file') {
            list.push({
              id: `file-${node.path}`,
              type: 'file',
              title: node.name,
              subtitle: node.path,
              icon: FileCode,
              onSelect: () => {
                selectFile(node);
                navigate(`/analysis/${selectedRepo.id}`);
              },
            });
          }
          if (node.children) collectFiles(node.children);
        });
      };
      collectFiles(selectedRepo.files);
    }

    if (!query.trim()) return list;

    const q = query.toLowerCase();
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [repositories, selectedRepo, query]);

  // Arrow key navigation
  useEffect(() => {
    const handleNavigation = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % Math.max(1, items.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) {
          items[selectedIndex].onSelect();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [isOpen, items, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl bg-charcoal-900 border border-charcoal-700/90 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] z-10 animate-in fade-in zoom-in-95 duration-100">
        {/* Input Bar */}
        <div className="flex items-center px-4 border-b border-charcoal-700/70 bg-charcoal-900">
          <Search className="w-4 h-4 text-charcoal-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, repository, or file name..."
            className="w-full bg-transparent py-3.5 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none font-mono"
          />
          <button
            onClick={onClose}
            className="p-1 text-charcoal-500 hover:text-charcoal-300 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {items.length === 0 ? (
            <div className="p-8 text-center text-xs text-charcoal-500">
              No matching commands or files found.
            </div>
          ) : (
            items.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-500/15 text-charcoal-100 border border-brand-500/30'
                      : 'text-charcoal-300 hover:bg-charcoal-850 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-md ${
                        isSelected ? 'bg-brand-500/20 text-brand-300' : 'bg-charcoal-800 text-charcoal-400'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate font-mono">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-[11px] text-charcoal-500 truncate">{item.subtitle}</div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-[11px] text-brand-400 font-mono shrink-0 pl-2">
                      <span>Jump</span>
                      <CornerDownLeft className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-charcoal-800 bg-charcoal-950/60 flex items-center justify-between text-[11px] text-charcoal-500 font-mono">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-charcoal-800 text-charcoal-400 border border-charcoal-700">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-charcoal-800 text-charcoal-400 border border-charcoal-700">↵</kbd> select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-charcoal-800 text-charcoal-400 border border-charcoal-700">esc</kbd> close
            </span>
          </div>
          <span className="text-brand-400">RepoMind Command</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
