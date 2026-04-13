import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchAgentEvalStatus } from '../../engine/evalStatus';

export function EvalDrawer({ onClose }: { onClose: () => void }) {
  const { data: evalStatus } = useQuery({
    queryKey: ['agent', 'eval-status'],
    queryFn: () => fetchAgentEvalStatus().catch(() => null),
    refetchInterval: 60_000,
  });

  return (
    <DrawerShell title="Quality Gate Details" onClose={onClose}>
      <div className="space-y-4 text-sm text-slate-300">
        {evalStatus ? (
          <>
            {['release', 'safety', 'integration', 'view_designer'].map((suite) => {
              const s = (evalStatus as any)[suite];
              if (!s) return null;
              return (
                <div key={suite} className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-slate-200 capitalize">{suite.replace('_', ' ')}</h3>
                    <span className={s.gate_passed ? 'text-emerald-400' : 'text-red-400'}>
                      {s.gate_passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {s.scenario_count} scenarios &middot; avg {Math.round((s.average_overall || 0) * 100)}%
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="text-slate-500">Loading eval data...</div>
        )}
      </div>
    </DrawerShell>
  );
}

function DrawerShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-2xl bg-slate-950 border-l border-slate-800 h-full overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
