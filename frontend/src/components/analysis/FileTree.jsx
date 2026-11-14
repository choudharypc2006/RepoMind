import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode2,
  FileText,
  Search,
  Filter,
  Layers,
  FileJson,
  FileCog,
  FileQuestion,
  ChevronsUpDown,
  X,
} from 'lucide-react';
import { SkeletonTree } from '../common/Skeleton';

// Get appropriate icon based on file extension
const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode2 className="w-4 h-4 text-cyan-400 shrink-0" />;
    case 'py':
      return <FileCode2 className="w-4 h-4 text-amber-400 shrink-0" />;
    case 'go':
      return <FileCode2 className="w-4 h-4 text-brand-400 shrink-0" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-emerald-400 shrink-0" />;
    case 'md':
    case 'txt':
      return <FileText className="w-4 h-4 text-charcoal-400 shrink-0" />;
    case 'yml':
    case 'yaml':
    case 'toml':
      return <FileCog className="w-4 h-4 text-rose-400 shrink-0" />;
    default:
      return <FileQuestion className="w-4 h-4 text-charcoal-400 shrink-0" />;
  }
};

const TreeNode = ({ node, activeFile, onSelectFile, expandedFolders, toggleFolder, level = 0 }) => {
  const isFolder = node.type === 'folder';
  const isExpanded = expandedFolders[node.path] ?? true;
  const isSelected = !isFolder && activeFile?.path === node.path;

  if (isFolder) {
    return (
      <div>
        <button
          onClick={() => toggleFolder(node.path)}
          className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-left rounded-md transition-colors hover:bg-charcoal-800/80 cursor-pointer group select-none`}
          style={{ paddingLeft: `${Math.max(8, level * 14 + 8)}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-charcoal-500 group-hover:text-charcoal-300 transition-colors shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-charcoal-500 group-hover:text-charcoal-300 transition-colors shrink-0" />
          )}

          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-brand-400/90 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-charcoal-400 shrink-0" />
          )}

          <span className="font-medium text-charcoal-300 group-hover:text-charcoal-100 truncate">
            {node.name}
          </span>
          {node.children && (
            <span className="text-[10px] text-charcoal-500 ml-auto font-mono">
              {node.children.length}
            </span>
          )}
        </button>

        {isExpanded && node.children && (
          <div className="flex flex-col">
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                activeFile={activeFile}
                onSelectFile={onSelectFile}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File Item
  return (
    <button
      onClick={() => onSelectFile(node)}
      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left rounded-md transition-colors cursor-pointer group ${
        isSelected
          ? 'bg-brand-500/15 text-brand-200 font-medium border-l-2 border-brand-500 rounded-l-none'
          : 'text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800/60'
      }`}
      style={{ paddingLeft: `${Math.max(8, level * 14 + 18)}px` }}
    >
      {getFileIcon(node.name)}
      <span className="truncate flex-1">{node.name}</span>
      {node.size && (
        <span className="text-[10px] text-charcoal-600 font-mono ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          {node.size}
        </span>
      )}
    </button>
  );
};

export const FileTree = ({ files = [], activeFile, onSelectFile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});

  const toggleFolder = (path) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !(prev[path] ?? true),
    }));
  };

  const collapseAll = () => {
    const closed = {};
    const traverse = (nodes) => {
      nodes.forEach((n) => {
        if (n.type === 'folder') {
          closed[n.path] = false;
          if (n.children) traverse(n.children);
        }
      });
    };
    traverse(files);
    setExpandedFolders(closed);
  };

  const expandAll = () => {
    setExpandedFolders({});
  };

  // Filter tree recursively based on search term
  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) return files;
    const term = searchTerm.toLowerCase();

    const filterNode = (node) => {
      if (node.type === 'file') {
        return node.name.toLowerCase().includes(term) || node.path.toLowerCase().includes(term);
      }
      if (node.children) {
        const matchingChildren = node.children
          .map(filterNode)
          .filter(Boolean);
        if (matchingChildren.length > 0) {
          return { ...node, children: matchingChildren };
        }
      }
      return null;
    };

    return files.map(filterNode).filter(Boolean);
  }, [files, searchTerm]);

  // Count total files in current tree
  const totalCount = useMemo(() => {
    let count = 0;
    const countFiles = (nodes) => {
      nodes.forEach((n) => {
        if (n.type === 'file') count++;
        if (n.children) countFiles(n.children);
      });
    };
    countFiles(files);
    return count;
  }, [files]);

  return (
    <div className="flex flex-col h-full bg-charcoal-900 border-r border-charcoal-700/70 select-none">
      {/* Header */}
      <div className="p-3 border-b border-charcoal-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-300">
            Explorer
          </span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-charcoal-800 text-charcoal-400 border border-charcoal-700">
            {totalCount} files
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={collapseAll}
            title="Collapse all"
            className="p-1 rounded text-charcoal-500 hover:text-charcoal-300 hover:bg-charcoal-800 transition-colors"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-charcoal-700/40">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal-500" />
          <input
            type="text"
            placeholder="Filter files (e.g. .ts, auth)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-charcoal-950 border border-charcoal-700/70 rounded-md pl-8 pr-3 py-1.5 text-xs text-charcoal-200 placeholder-charcoal-500 focus:outline-none focus:border-brand-500/80 transition-colors"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {files.length === 0 ? (
          <SkeletonTree count={10} />
        ) : filteredFiles.length === 0 ? (
          <div className="p-6 text-center text-xs text-charcoal-500 space-y-2">
            <p>No matching files found for "{searchTerm}".</p>
            <button
              onClick={() => setSearchTerm('')}
              className="text-brand-400 hover:text-brand-300 underline font-medium cursor-pointer"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          filteredFiles.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              activeFile={activeFile}
              onSelectFile={onSelectFile}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              level={0}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FileTree;

