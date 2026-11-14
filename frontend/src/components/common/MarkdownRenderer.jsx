import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Lightweight, zero-dependency Markdown renderer tailored for AI code explanations.
 * Formats headings, lists, bold text, inline code, and fenced code blocks with copy buttons.
 */
export const MarkdownRenderer = ({ content, className = '' }) => {
  if (!content || typeof content !== 'string') return null;

  // Split into lines
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines = [];

  const renderFormattedInline = (text) => {
    // Regex matches inline code `...`, bold **...**, italic *...*
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining) {
      // Inline code: `code`
      const codeMatch = remaining.match(/`([^`]+)`/);
      // Bold: **text**
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

      let earliestMatch = null;
      let matchType = null;

      if (codeMatch && boldMatch) {
        if (codeMatch.index < boldMatch.index) {
          earliestMatch = codeMatch;
          matchType = 'code';
        } else {
          earliestMatch = boldMatch;
          matchType = 'bold';
        }
      } else if (codeMatch) {
        earliestMatch = codeMatch;
        matchType = 'code';
      } else if (boldMatch) {
        earliestMatch = boldMatch;
        matchType = 'bold';
      }

      if (!earliestMatch) {
        parts.push(<span key={keyIdx++}>{remaining}</span>);
        break;
      }

      const matchIndex = earliestMatch.index;
      if (matchIndex > 0) {
        parts.push(<span key={keyIdx++}>{remaining.slice(0, matchIndex)}</span>);
      }

      if (matchType === 'code') {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded bg-charcoal-800 text-brand-300 font-mono text-[11px] border border-charcoal-700/60"
          >
            {earliestMatch[1]}
          </code>
        );
      } else if (matchType === 'bold') {
        parts.push(
          <strong key={keyIdx++} className="font-semibold text-charcoal-100">
            {earliestMatch[1]}
          </strong>
        );
      }

      remaining = remaining.slice(matchIndex + earliestMatch[0].length);
    }

    return parts;
  };

  const CodeBlockComponent = ({ code, lang }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="my-2 rounded-lg bg-charcoal-950 border border-charcoal-750 overflow-hidden font-mono text-xs">
        <div className="flex items-center justify-between px-3 py-1.5 bg-charcoal-900 border-b border-charcoal-800 text-[11px] text-charcoal-400">
          <span className="font-semibold text-charcoal-300 uppercase">{lang || 'code'}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-charcoal-400 hover:text-charcoal-100 transition-colors p-0.5"
            title="Copy snippet"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="text-[10px]">Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-3 overflow-x-auto text-charcoal-200 leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <CodeBlockComponent
            key={`code-${i}`}
            code={codeBlockLines.join('\n')}
            lang={codeBlockLang}
          />
        );
        codeBlockLines = [];
        inCodeBlock = false;
        codeBlockLang = '';
      } else {
        // Start of code block
        inCodeBlock = true;
        codeBlockLang = line.trim().replace(/^```/, '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="text-xs font-bold text-brand-300 mt-2 mb-1">
          {renderFormattedInline(line.replace('### ', ''))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-white mt-3 mb-1 border-b border-charcoal-800 pb-1">
          {renderFormattedInline(line.replace('## ', ''))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={i} className="text-sm font-bold text-white mt-3 mb-1.5">
          {renderFormattedInline(line.replace('# ', ''))}
        </h2>
      );
      continue;
    }

    // Bullet list items
    if (/^\s*[-*]\s+/.test(line)) {
      const bulletText = line.replace(/^\s*[-*]\s+/, '');
      elements.push(
        <div key={i} className="flex items-start gap-2 my-0.5 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
          <span className="text-charcoal-300 leading-relaxed">
            {renderFormattedInline(bulletText)}
          </span>
        </div>
      );
      continue;
    }

    // Numbered list items
    if (/^\s*\d+\.\s+/.test(line)) {
      const match = line.match(/^\s*(\d+)\.\s+(.*)/);
      elements.push(
        <div key={i} className="flex items-start gap-2 my-0.5 ml-1">
          <span className="text-[11px] font-mono text-brand-400 shrink-0 font-semibold">
            {match[1]}.
          </span>
          <span className="text-charcoal-300 leading-relaxed">
            {renderFormattedInline(match[2])}
          </span>
        </div>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={i} className="h-1.5" />);
      continue;
    }

    // Standard paragraph line
    elements.push(
      <p key={i} className="text-charcoal-300 leading-relaxed">
        {renderFormattedInline(line)}
      </p>
    );
  }

  // If file ended inside an unclosed code block, flush it
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <CodeBlockComponent
        key="code-unclosed"
        code={codeBlockLines.join('\n')}
        lang={codeBlockLang}
      />
    );
  }

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
};

export default MarkdownRenderer;

