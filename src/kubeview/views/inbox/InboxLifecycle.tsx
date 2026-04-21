import { cn } from '@/lib/utils';
import type { InboxItemType, InboxStatus } from '../../engine/inboxApi';

const LIFECYCLES: Record<string, Array<{ key: string; label: string }>> = {
  finding: [
    { key: 'new', label: 'New' },
    { key: 'acknowledged', label: 'Ack' },
    { key: 'investigating', label: 'Investigating' },
    { key: 'action_taken', label: 'Action' },
    { key: 'verifying', label: 'Verifying' },
    { key: 'resolved', label: 'Resolved' },
  ],
  task: [
    { key: 'new', label: 'New' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Done' },
  ],
  alert: [
    { key: 'new', label: 'New' },
    { key: 'acknowledged', label: 'Ack' },
    { key: 'resolved', label: 'Resolved' },
  ],
  assessment: [
    { key: 'new', label: 'New' },
    { key: 'acknowledged', label: 'Ack' },
    { key: 'escalated', label: 'Escalated' },
  ],
};

export function InboxLifecycleBadge({
  itemType,
  status,
}: {
  itemType: InboxItemType;
  status: InboxStatus;
}) {
  const steps = LIFECYCLES[itemType] || LIFECYCLES.finding;
  const currentIdx = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-0.5">
      {steps.map((step, idx) => {
        const isCurrent = step.key === status;
        const isPast = idx < currentIdx;

        return (
          <div key={step.key} className="flex items-center gap-0.5">
            <div
              className={cn(
                'h-1.5 rounded-full transition-colors',
                idx === 0 ? 'w-3' : 'w-2.5',
                isCurrent && 'bg-violet-500',
                isPast && 'bg-emerald-500',
                !isCurrent && !isPast && 'bg-slate-700',
              )}
              title={step.label}
            />
          </div>
        );
      })}
    </div>
  );
}

export function InboxLifecycleStepper({
  itemType,
  status,
}: {
  itemType: InboxItemType;
  status: InboxStatus;
}) {
  const steps = LIFECYCLES[itemType] || LIFECYCLES.finding;
  const currentIdx = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, idx) => {
        const isCurrent = step.key === status;
        const isPast = idx < currentIdx;
        const isLast = idx === steps.length - 1;

        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-2.5 h-2.5 rounded-full border-2 transition-colors',
                  isCurrent && 'bg-violet-500 border-violet-500',
                  isPast && 'bg-emerald-500 border-emerald-500',
                  !isCurrent && !isPast && 'bg-transparent border-slate-600',
                )}
              />
              <span
                className={cn(
                  'text-[10px] mt-1 whitespace-nowrap',
                  isCurrent && 'text-violet-400 font-medium',
                  isPast && 'text-emerald-400',
                  !isCurrent && !isPast && 'text-slate-600',
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'w-4 h-0.5 rounded-full mb-3',
                  isPast ? 'bg-emerald-500' : 'bg-slate-700',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
