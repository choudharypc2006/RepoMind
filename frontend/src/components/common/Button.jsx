import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-brand-600 hover:bg-brand-500 text-white font-medium border border-brand-500/40 active:translate-y-px',
  secondary:
    'bg-charcoal-800 hover:bg-charcoal-750 text-charcoal-100 border border-charcoal-700/80 hover:border-charcoal-600 active:translate-y-px',
  outline:
    'bg-transparent hover:bg-charcoal-800 text-charcoal-300 hover:text-charcoal-100 border border-charcoal-700 hover:border-charcoal-600 active:translate-y-px',
  ghost:
    'bg-transparent hover:bg-charcoal-800/80 text-charcoal-400 hover:text-charcoal-200 border border-transparent',
  danger:
    'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 active:translate-y-px',
};

const SIZES = {
  xs: 'px-2 py-1 text-xs gap-1.5 rounded',
  sm: 'px-2.5 py-1.5 text-xs font-medium gap-1.5 rounded-md',
  md: 'px-3.5 py-2 text-sm font-medium gap-2 rounded-lg',
  lg: 'px-4 py-2.5 text-sm font-medium gap-2.5 rounded-lg',
};

export const Button = ({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`inline-flex items-center justify-center transition-all duration-150 select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${VARIANTS[variant] || VARIANTS.secondary} ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
      {!isLoading && IconRight ? <IconRight className="w-4 h-4 shrink-0" /> : null}
    </button>
  );
};

export default Button;

