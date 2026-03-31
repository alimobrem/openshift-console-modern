import { CheckCircle, Circle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanStep } from '../../store/intentStore';

interface PlanViewerProps {
  steps: PlanStep[];
}

const statusIcon: Record<PlanStep['status'], React.ReactNode> = {
  pending: <Circle className="w-4 h-4 text-slate-500" />,
  running: <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />,
  done: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  error: <AlertCircle className="w-4 h-4 text-red-400" />,
};

export function PlanViewer({ steps }: PlanViewerProps) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Execution Plan
      </h3>
      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-700" />

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="relative flex items-start gap-3 pl-0">
              <div className="relative z-10 mt-0.5 shrink-0">{statusIcon[step.status]}</div>
              <div
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 transition-colors',
                  step.status === 'running'
                    ? 'border-violet-500/30 bg-violet-500/5'
                    : step.status === 'done'
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : step.status === 'error'
                        ? 'border-red-500/20 bg-red-500/5'
                        : 'border-slate-800 bg-slate-900/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">{step.label}</span>
                  <span className={cn('text-xs', step.agent.color)}>{step.agent.name}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                {step.durationMs != null && step.status === 'done' && (
                  <span className="text-xs text-slate-500 mt-1 inline-block">
                    {(step.durationMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
