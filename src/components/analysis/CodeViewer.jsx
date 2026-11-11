import React, { useState } from 'react';
import {
  Copy,
  Check,
  Code2,
  Sparkles,
  X,
  FileCode,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  CornerDownRight,
  Loader2,
  AlertTriangle,
  FileWarning,
} from 'lucide-react';
import { Button } from '../common/Button';

// Language selector options
const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C / C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'yaml', label: 'YAML' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'shell', label: 'Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'text', label: 'Plain Text' },
];

export const CodeViewer = ({
  file,
  openTabs = [],
  onSelectTab,
  onCloseTab,
  onExplainCode,
  isExplaining = false,
  isLoadingFile = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [selectedLanguage, setSelectedLanguage] = useState(file?.language || 'javascript');

  // Sync selected language when file changes
  React.useEffect(() => {
    if (file?.language) {
      setSelectedLanguage(file.language);
    }
  }, [file]);

  const handleCopy = () => {
    if (!file?.content) return;
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-charcoal-950 p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-charcoal-900 border border-charcoal-800 flex items-center justify-center text-charcoal-500 mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-medium text-charcoal-200">No file selected</h3>
        <p className="text-xs text-charcoal-400 max-w-sm mt-1">
          Select any file from the explorer on the left to inspect source code and trigger Gemini AI explanations.
        </p>
      </div>
    );
  }

  const isFileLoading = file.isLoading || (isLoadingFile && !file.content);
  const isFileError = file.isError;
  const lines = (file?.content || '').split('\n');

  // Lightweight syntax highlighting helper
  const renderHighlightedLine = (line) => {
    if (!line) return <span>&nbsp;</span>;

    // Comments
    const trimmed = line.trim();
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*')
    ) {
      return <span className="text-charcoal-500 italic">{line}</span>;
    }

    // Tokenizer regex matching strings, numbers, keywords, function calls
    const tokenRegex = /(["'`].*?["'`]|\b\d+(?:\.\d+)?\b|\b(?:import|export|from|const|let|var|function|return|async|await|class|def|if|else|elif|for|while|type|interface|package|struct|public|private|protected|static|void|int|float|double|boolean|char|new|try|catch|finally|throw|extends|implements|switch|case|default|break|continue|fn|mut|impl|pub|self|Self|val|nil|null|undefined|true|false)\b|[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()|[{}()[\];,.<>:=!+\-*/%&|^~?]+|[a-zA-Z_$][a-zA-Z0-9_$]*|\s+)/g;

    const parts = line.match(tokenRegex) || [line];

    return (
      <span>
        {parts.map((token, i) => {
          // String literals
          if (/^["'`]/.test(token)) {
            return (
              <span key={i} className="text-emerald-400">
                {token}
              </span>
            );
          }

          // Numeric literals
          if (/^\d+(?:\.\d+)?$/.test(token)) {
            return (
              <span key={i} className="text-amber-400">
                {token}
              </span>
            );
          }

          // Keywords
          const keywords = new Set([
            'import', 'export', 'from', 'const', 'let', 'var', 'function',
            'return', 'async', 'await', 'class', 'def', 'if', 'else', 'elif',
            'for', 'while', 'type', 'interface', 'package', 'struct', 'public',
            'private', 'protected', 'static', 'void', 'int', 'float', 'double',
            'boolean', 'char', 'new', 'try', 'catch', 'finally', 'throw',
            'extends', 'implements', 'switch', 'case', 'default', 'break',
            'continue', 'fn', 'mut', 'impl', 'pub', 'self', 'Self', 'val',
            'nil', 'null', 'undefined', 'true', 'false',
          ]);
          if (keywords.has(token)) {
            return (
              <span key={i} className="text-brand-400 font-semibold">
                {token}
              </span>
            );
          }

          // Function invocations (followed by opening paren in original line check)
          if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(token) && parts[i + 1] === '(') {
            return (
              <span key={i} className="text-cyan-300">
                {token}
              </span>
            );
          }

          // Punctuation / Operators
          if (/^[{}()[\];,.<>:=!+\-*/%&|^~?]+$/.test(token)) {
            return (
              <span key={i} className="text-charcoal-400">
                {token}
              </span>
            );
          }

          return (
            <span key={i} className="text-charcoal-200">
              {token}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-charcoal-950 overflow-hidden">
      {/* File Tabs Bar */}
      <div className="flex items-center bg-charcoal-900 border-b border-charcoal-700/70 overflow-x-auto no-scrollbar">
        {openTabs.map((tab) => {
          const isActive = tab.path === file.path;
          return (
            <div
              key={tab.path}
              onClick={() => onSelectTab(tab)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-mono border-r border-charcoal-700/60 cursor-pointer transition-colors border-t-2 select-none group shrink-0 ${
                isActive
                  ? 'bg-charcoal-950 text-brand-300 border-t-brand-500'
                  : 'bg-charcoal-900/60 text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-850 border-t-transparent'
              }`}
            >
              <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-brand-400' : 'text-charcoal-500'}`} />
              <span className="truncate max-w-[140px]">{tab.name}</span>
              <button
                onClick={(e) => onCloseTab(tab.path, e)}
                className="opacity-40 group-hover:opacity-100 hover:text-rose-400 transition-opacity p-0.5 rounded"
                title="Close tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Code Header Controls */}
      <div className="px-4 py-2 bg-charcoal-900/80 border-b border-charcoal-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* File Path & Stats */}
        <div className="flex items-center gap-2 font-mono text-charcoal-400 min-w-0">
          <span className="text-charcoal-500 hidden sm:inline">Path:</span>
          <span className="text-charcoal-200 truncate">{file.path}</span>
          <span className="text-charcoal-600">•</span>
          <span className="text-charcoal-400 shrink-0">{lines.length} lines</span>
          <span className="text-charcoal-600">•</span>
          <span className="text-charcoal-400 shrink-0">{file.size}</span>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-charcoal-500 text-[11px] hidden md:inline">Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-charcoal-800 border border-charcoal-700 rounded px-2 py-1 text-xs text-charcoal-200 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size Adjusters */}
          <div className="hidden sm:flex items-center bg-charcoal-800 border border-charcoal-700 rounded overflow-hidden">
            <button
              onClick={() => setFontSize((s) => Math.max(11, s - 1))}
              className="p-1 text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-750 transition-colors"
              title="Decrease font size"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[10px] font-mono text-charcoal-400 border-x border-charcoal-700">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize((s) => Math.min(18, s + 1))}
              className="p-1 text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-750 transition-colors"
              title="Increase font size"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Copy Code Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-charcoal-800 hover:bg-charcoal-750 border border-charcoal-700 text-charcoal-300 hover:text-charcoal-100 transition-colors"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-charcoal-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Explain Code Button */}
          <Button
            variant="primary"
            size="xs"
            onClick={onExplainCode}
            isLoading={isExplaining}
            icon={Sparkles}
            className="shadow-glow-brand"
          >
            Explain Code
          </Button>
        </div>
      </div>

      {/* Code Text Area with Line Numbers, Loading, or Error */}
      <div className="flex-1 overflow-auto bg-charcoal-950 font-mono text-charcoal-200 select-text p-4 relative">
        {isFileLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-charcoal-950/90 z-10 backdrop-blur-xs">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin mb-3" />
            <p className="text-sm text-charcoal-200 font-medium">Fetching file content from GitHub...</p>
            <p className="text-xs text-charcoal-500 font-mono mt-1">{file.path}</p>
          </div>
        ) : isFileError ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <FileWarning className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-charcoal-100">Unable to Display File</h4>
            <p className="text-xs text-rose-400/90 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mt-3 w-full font-mono text-left leading-relaxed">
              {file.errorMessage || file.content}
            </p>
            <p className="text-[11px] text-charcoal-500 mt-3">
              RepoMind only displays text-based source files up to 500 KB to keep browser performance optimal.
            </p>
          </div>
        ) : (
          <div
            className="table min-w-full font-mono"
            style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize * 1.65}px` }}
          >
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="table-row hover:bg-charcoal-900/60 group transition-colors"
              >
                {/* Line Number */}
                <div className="table-cell pr-4 text-right select-none text-charcoal-600 group-hover:text-charcoal-400 w-10 pl-2">
                  {idx + 1}
                </div>
                {/* Line Text */}
                <div className="table-cell whitespace-pre pr-4 pl-2 border-l border-charcoal-800/40">
                  {renderHighlightedLine(line)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeViewer;

