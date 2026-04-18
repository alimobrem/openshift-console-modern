import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InvestigationPhase } from '../../../engine/monitorClient';

const PHASE_LABELS: Record<string, string> = {
  triage: 'Triage',
  diagnose: 'Diagnose',
  remediate: 'Remediate',
  verify: 'Verify',
  postmortem: 'Postmortem',
};

export function InvestigationPhases({ phases, planName }: { phases: InvestigationPhase[]; planName?: string }) {
  return (
    <div className="mb-2 py-2 px-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
      {planName && (
        <div className="text-[10px] text-slate-500 mb-1.5 font-medium uppercase tracking-wider">
          {planName}
        </div>
      )}
      <div className="flex items-center gap-1">
        {phases.map((phase, idx) => {
          const label = PHASE_LABELS[phase.id] || phase.id;
          const isLast = idx === phases.length - 1;
          return (
            <div key={phase.id} className="flex items-center gap-1">
              <div className="flex items-center gap-1">
                {phase.status === 'complete' && (
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                )}
                {phase.status === 'running' && (
                  <Loader2 className="w-3 h-3 text-violet-400 animate-spin shrink-0" />
                )}
                {phase.status === 'failed' && (
                  <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                )}
                {phase.status === 'pending' && (
                  <div className="w-3 h-3 rounded-full border border-slate-600 shrink-0" />
                )}
                {phase.status === 'skipped' && (
                  <div className="w-3 h-3 rounded-full bg-slate-700 shrink-0" />
                )}
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    phase.status === 'complete' && 'text-emerald-400',
                    phase.status === 'running' && 'text-violet-300',
                    phase.status === 'failed' && 'text-red-400',
                    phase.status === 'pending' && 'text-slate-500',
                    phase.status === 'skipped' && 'text-slate-600',
                  )}
                  title={phase.summary || undefined}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div className={cn(
                  'w-4 h-px mx-0.5',
                  phase.status === 'complete' ? 'bg-emerald-700' : 'bg-slate-700',
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
