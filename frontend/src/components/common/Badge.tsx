import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'pass' | 'warn' | 'fail' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ status, className, children, ...props }) => {
  const styles = {
    pass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warn: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    fail: 'bg-red-500/10 text-red-400 border-red-500/20',
    neutral: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        styles[status],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
