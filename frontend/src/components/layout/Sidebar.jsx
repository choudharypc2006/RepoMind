import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Settings,
  GitBranch,
  Sparkles,
  ChevronRight,
  Code2,
  FolderGit2,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { useRepo } from '../../context/RepoContext';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { repositories, selectedRepoId, selectRepository, userSettings } = useRepo();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      to: '/',
    },
    {
      label: 'Repository Analysis',
      icon: Code2,
      to: `/analysis/${selectedRepoId || ''}`,
      activeWhen: (path) => path.startsWith('/analysis'),
    },
    {
      label: 'History',
      icon: History,
      to: '/history',
    },
    {
      label: 'Settings',
      icon: Settings,
      to: '/settings',
    },
  ];

  const handleSelectRecent = (repoId) => {
    selectRepository(repoId);
    navigate(`/analysis/${repoId}`);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-charcoal-900 border-r border-charcoal-700/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-charcoal-700/60">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none"
            onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
          >
            <div className="w-7 h-7 rounded-lg bg-charcoal-800 border border-charcoal-700 flex items-center justify-center text-charcoal-200 group-hover:text-white group-hover:border-charcoal-600 transition-colors">
              <FolderGit2 className="w-4 h-4 text-brand-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-charcoal-100 text-sm tracking-tight group-hover:text-white transition-colors">
                RepoMind
              </span>
              <span className="text-[10px] text-charcoal-500 font-mono">code workspace</span>
            </div>
          </NavLink>
        </div>

        {/* Primary Navigation */}
        <div className="px-3 py-3 space-y-1">
          <div className="px-2 pb-1.5 text-[11px] font-medium text-charcoal-500">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.activeWhen
              ? item.activeWhen(location.pathname)
              : location.pathname === item.to;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-charcoal-800 text-charcoal-100 border border-charcoal-700/80'
                    : 'text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-850'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-brand-400' : 'text-charcoal-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Quick New Analysis Action */}
        <div className="px-3 py-1">
          <button
            onClick={() => {
              navigate('/');
              if (window.innerWidth < 1024) setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-brand-300 bg-brand-500/10 hover:bg-brand-500/15 border border-brand-500/30 rounded-lg transition-colors cursor-pointer group"
          >
            <PlusCircle className="w-3.5 h-3.5 text-brand-400 group-hover:rotate-90 transition-transform duration-200" />
            <span>Analyze New Repo</span>
          </button>
        </div>

        {/* Recent Repositories Section */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          <div className="flex items-center justify-between px-2 pb-1.5">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-charcoal-500">
              Recent Repositories
            </span>
            <span className="text-[10px] text-charcoal-500 font-mono">
              {repositories.length}
            </span>
          </div>

          {repositories.length === 0 ? (
            <div className="px-3 py-4 text-center rounded-lg border border-dashed border-charcoal-800 text-xs text-charcoal-500">
              No repositories yet
            </div>
          ) : (
            repositories.slice(0, 6).map((repo) => {
              const isSelected = selectedRepoId === repo.id && location.pathname.startsWith('/analysis');
              return (
                <button
                  key={repo.id}
                  onClick={() => handleSelectRecent(repo.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-charcoal-800 text-charcoal-100 border border-brand-500/30'
                      : 'text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-850'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FolderGit2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-brand-400' : 'text-charcoal-500 group-hover:text-charcoal-400'
                      }`}
                    />
                    <div className="truncate">
                      <div className="truncate font-medium">{repo.fullName}</div>
                      <div className="text-[10px] text-charcoal-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{repo.primaryLanguage}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-charcoal-400 shrink-0" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info: Engine Model */}
        <div className="p-3 border-t border-charcoal-700/60 bg-charcoal-950/40">
          <div className="px-2.5 py-2 rounded-lg bg-charcoal-850 border border-charcoal-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <div className="truncate">
                <span className="text-[11px] font-medium text-charcoal-200 block truncate">
                  Gemini Code Engine
                </span>
                <span className="text-[10px] text-charcoal-500 font-mono block truncate">
                  {userSettings.aiModel}
                </span>
              </div>
            </div>
            <Cpu className="w-3.5 h-3.5 text-charcoal-500 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

