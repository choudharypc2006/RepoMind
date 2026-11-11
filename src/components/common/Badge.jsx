import React from 'react';

const VARIANT_MAP = {
  default: 'bg-charcoal-800 text-charcoal-200 border-charcoal-700',
  brand: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const sizeClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md border ${VARIANT_MAP[variant] || VARIANT_MAP.default} ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;

