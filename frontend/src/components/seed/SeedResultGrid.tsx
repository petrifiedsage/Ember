import React from 'react';
import { Badge } from '../common/Badge';

interface SeedResultGridProps {
  results: any[];
}

export const SeedResultGrid: React.FC<SeedResultGridProps> = ({ results }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {['gmail', 'outlook', 'yahoo'].map((provider) => {
        const result = results.find(r => r.provider === provider);
        let badgeVariant: 'pass' | 'warn' | 'fail' | 'default' = 'default';
        let text = 'WAITING...';

        if (result) {
          if (result.placement === 'inbox') {
            badgeVariant = 'pass';
            text = 'INBOX';
          } else if (result.placement === 'promotions') {
            badgeVariant = 'warn';
            text = 'PROMOTIONS';
          } else if (result.placement === 'spam') {
            badgeVariant = 'fail';
            text = 'SPAM';
          } else if (result.placement === 'missing') {
            badgeVariant = 'fail';
            text = 'NOT FOUND';
          }
        }

        return (
          <div key={provider} className="bg-zinc-800/50 rounded-lg p-4 flex flex-col items-center justify-center border border-zinc-700/50">
            <div className="w-12 h-12 mb-3 rounded-full bg-zinc-700/50 border border-zinc-600 flex items-center justify-center text-lg font-bold text-white uppercase">
              {provider[0]}
            </div>
            <h4 className="text-white font-medium capitalize mb-2">{provider}</h4>
            <Badge variant={badgeVariant as any}>{text}</Badge>
          </div>
        );
      })}
    </div>
  );
};
