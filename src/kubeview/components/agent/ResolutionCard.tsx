import { CheckCircle, Wrench, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Resolution } from '../../engine/monitorClient';

export type { Resolution };

export interface ResolutionCardProps {
  resolution: Resolution;
  compact?: boolean;
}

const RESOLVED_BY_CONFIG: Record<string, { icon: typeof CheckCircle; label: string; color: string }> = {
  'auto-fix': { icon: Wrench, label: 'Auto-fixed', color: 'text-emerald-400' },
  'self-healed': { icon: Heart, label: 'Self-healed', color: 'text-blue-400' },
};

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function ResolutionCard({ resolution, compact }: ResolutionCardProps) {
  const config = RESOLVED_BY_CONFIG[resolution.resolvedBy] || RESOLVED_BY_CONFIG['self-healed'];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg border border-emerald-800/50 border-l-4 border-l-emerald-500 bg-emerald-950/30',
        compact ? 'px-3 py-2' : 'p-4',
      )}
    >
      <div className="flex items-start gap-2">
        <CheckCircle className={cn('shrink-0 text-emerald-400', compact ? 'h-3.5 w-3.5 mt-0.5' : 'h-4 w-4 mt-0.5')} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium bg-emerald-900/50 text-emerald-300', compact ? 'text-xs' : 'text-xs')}>
              <Icon className="h-3 w-3" />
              {config.label}
            </span>
            <span className="text-xs text-slate-500">{resolution.category}</span>
            <span className="ml-auto text-xs text-slate-500">
              {formatRelativeTime(resolution.timestamp)}
            </span>
          </div>
          <h4 className={cn('font-medium text-emerald-200 mt-1', compact ? 'text-xs' : 'text-sm')}>
            {resolution.title}
          </h4>
        </div>
      </div>
    </div>
  );
}
