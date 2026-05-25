import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SeedResultGridProps {
  results: any[];
}

const PROVIDERS = {
  gmail: {
    name: 'Gmail',
    color: 'hover:border-red-500/50',
    iconColor: 'text-red-500',
    bgBase: 'bg-red-500/10',
    bgGlow: 'group-hover:bg-red-500/20',
    logo: 'G'
  },
  outlook: {
    name: 'Outlook',
    color: 'hover:border-blue-500/50',
    iconColor: 'text-blue-500',
    bgBase: 'bg-blue-500/10',
    bgGlow: 'group-hover:bg-blue-500/20',
    logo: 'O'
  },
  yahoo: {
    name: 'Yahoo!',
    color: 'hover:border-purple-500/50',
    iconColor: 'text-purple-500',
    bgBase: 'bg-purple-500/10',
    bgGlow: 'group-hover:bg-purple-500/20',
    logo: 'Y'
  }
};

export const SeedResultGrid: React.FC<SeedResultGridProps> = ({ results }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {(Object.keys(PROVIDERS) as Array<keyof typeof PROVIDERS>).map((providerKey) => {
        const config = PROVIDERS[providerKey];
        const result = results.find(r => r.provider === providerKey);
        
        let placement = 'WAITING';
        let statusColor = 'text-zinc-500';
        let bgStatusColor = 'bg-zinc-500/10 border-zinc-500/20';
        let Icon = Search;
        let isWaiting = true;

        if (result) {
          isWaiting = false;
          if (result.placement === 'inbox') {
            placement = 'INBOX';
            statusColor = 'text-emerald-400';
            bgStatusColor = 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
            Icon = CheckCircle2;
          } else if (result.placement === 'promotions') {
            placement = 'PROMOTIONS';
            statusColor = 'text-amber-400';
            bgStatusColor = 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
            Icon = AlertTriangle;
          } else if (result.placement === 'spam') {
            placement = 'SPAM';
            statusColor = 'text-red-400';
            bgStatusColor = 'bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
            Icon = XCircle;
          } else if (result.placement === 'missing') {
            placement = 'NOT FOUND';
            statusColor = 'text-zinc-400';
            bgStatusColor = 'bg-zinc-500/10 border-zinc-500/20';
            Icon = XCircle;
          }
        }

        return (
          <div 
            key={providerKey} 
            className={cn(
              "group relative overflow-hidden bg-zinc-900/80 rounded-2xl p-8 flex flex-col items-center justify-center border border-zinc-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
              config.color
            )}
          >
            {/* Background Glow */}
            <div className={cn(
              "absolute inset-0 opacity-0 transition-opacity duration-500 blur-3xl -z-10",
              config.bgGlow
            )} />

            {/* Provider Logo */}
            <div className={cn(
              "w-20 h-20 mb-5 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg transition-transform duration-300 group-hover:scale-110",
              config.bgBase,
              config.iconColor
            )}>
              {config.logo}
            </div>

            <h4 className="text-white text-xl font-semibold tracking-tight mb-5">
              {config.name}
            </h4>
            
            {/* Status Pill */}
            <div className={cn(
              "flex items-center space-x-2 px-5 py-2 rounded-full border transition-all duration-300",
              bgStatusColor
            )}>
              <Icon className={cn("w-4 h-4", statusColor, isWaiting && "animate-pulse")} />
              <span className={cn("text-xs font-bold tracking-wider", statusColor)}>
                {placement}
                {isWaiting && "..."}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
