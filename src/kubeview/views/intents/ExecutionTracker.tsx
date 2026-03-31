import { CheckCircle, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Intent } from '../../store/intentStore';

interface ExecutionTrackerProps {
  intent: Intent;
}

export function ExecutionTracker({ intent }: ExecutionTrackerProps) {
  if (intent.status !== 'executing' && intent.status !== 'completed' && intent.status !== 'approved') {
    return null;
  }

  const completedSteps = intent.plan.filter((s) => s.status === 'done').length;
  const totalSteps = intent.plan.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {intent.status === 'completed' ? 'Execution Complete' : 'Executing...'}
        </h3>
        <span className="text-xs text-slate-500">
          {completedSteps}/{totalSteps} steps
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            intent.status === 'completed' ? 'bg-emerald-500' : 'bg-violet-500'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2">
        {intent.plan.map((step) => (
          <div
            key={step.id}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
              step.status === 'done'
                ? 'text-emerald-400'
                : step.status === 'running'
                  ? 'text-violet-300 bg-violet-500/5'
                  : 'text-slate-500'
            )}
          >
            {step.status === 'done' ? (
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            ) : step.status === 'running' ? (
              <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
            ) : (
              <Clock className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{step.label}</span>
            {step.durationMs != null && step.status === 'done' && (
              <span className="ml-auto text-xs text-slate-600">
                {(step.durationMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        ))}
      </div>

      {intent.status === 'completed' && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-400">
          All steps completed successfully.
        </div>
      )}
    </div>
  );
}
