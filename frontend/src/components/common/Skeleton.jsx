import React from 'react';

/**
 * Reusable animated loading skeleton components for RepoMind.
 */

export const SkeletonLine = ({ className = 'h-4 w-full', rounded = 'rounded' }) => (
  <div className={`bg-charcoal-800/80 animate-pulse ${rounded} ${className}`} />
);

export const SkeletonCodeLines = ({ count = 18 }) => {
  // Generate realistic code line widths
  const widths = ['w-3/4', 'w-1/2', 'w-5/6', 'w-2/3', 'w-1/3', 'w-4/5', 'w-1/4', 'w-3/5', 'w-2/5'];

  return (
    <div className="space-y-2.5 p-4 font-mono">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-6 h-3 bg-charcoal-800/40 rounded animate-pulse shrink-0" />
          <div
            className={`h-3.5 bg-charcoal-800/70 rounded animate-pulse ${
              widths[i % widths.length]
            }`}
            style={{
              animationDelay: `${(i % 5) * 120}ms`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export const SkeletonTree = ({ count = 8 }) => (
  <div className="space-y-2 p-2">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-2 px-2 py-1.5 animate-pulse"
        style={{ paddingLeft: `${(i % 3) * 16 + 8}px` }}
      >
        <div className="w-3.5 h-3.5 rounded bg-charcoal-800 shrink-0" />
        <div
          className={`h-3 rounded bg-charcoal-800 ${
            i % 2 === 0 ? 'w-28' : 'w-20'
          }`}
        />
      </div>
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`p-5 rounded-xl bg-charcoal-900 border border-charcoal-800 animate-pulse space-y-3 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="h-4 bg-charcoal-800 rounded w-1/3" />
      <div className="h-4 bg-charcoal-800 rounded w-12" />
    </div>
    <div className="h-3 bg-charcoal-800/60 rounded w-3/4" />
    <div className="h-3 bg-charcoal-800/60 rounded w-1/2" />
    <div className="flex items-center gap-3 pt-2">
      <div className="h-3 bg-charcoal-800/40 rounded w-12" />
      <div className="h-3 bg-charcoal-800/40 rounded w-12" />
      <div className="h-3 bg-charcoal-800/40 rounded w-16" />
    </div>
  </div>
);

export default { SkeletonLine, SkeletonCodeLines, SkeletonTree, SkeletonCard };

