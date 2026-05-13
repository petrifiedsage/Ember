import React from 'react';
import { Badge } from '../common/Badge';

interface DnsCheckRowProps {
  title: string;
  status: 'pass' | 'warn' | 'fail';
  note: string;
  record: string | null;
}

export const DnsCheckRow: React.FC<DnsCheckRowProps> = ({ title, status, note, record }) => {
  return (
    <div className="py-5 border-b border-white/5 last:border-0 flex flex-col sm:flex-row sm:items-start gap-4">
      <div className="w-32 flex-shrink-0">
        <div className="font-medium text-white mb-2">{title}</div>
        <Badge status={status}>{status.toUpperCase()}</Badge>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-zinc-300 mb-2">{note}</div>
        {record && (
          <div className="mt-2 bg-background border border-white/5 rounded-md p-3 overflow-x-auto text-xs font-mono text-zinc-400">
            {record}
          </div>
        )}
      </div>
    </div>
  );
};
