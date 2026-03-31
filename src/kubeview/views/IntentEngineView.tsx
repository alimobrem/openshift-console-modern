import { Brain, Clock, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIntentStore, type Intent, type IntentStatus } from '../store/intentStore';
import { SectionHeader } from '../components/primitives/SectionHeader';
import { formatAge } from '../engine/dateUtils';
import { IntentInput } from './intents/IntentInput';
import { PlanViewer } from './intents/PlanViewer';
import { SimulationPanel } from './intents/SimulationPanel';
import { IntentActions } from './intents/IntentActions';
import { ExecutionTracker } from './intents/ExecutionTracker';

const statusMeta: Record<IntentStatus, { label: string; icon: React.ReactNode; color: string }> = {
  planning: { label: 'Planning', icon: <Loader2 className="w-3 h-3 animate-spin" />, color: 'text-blue-400' },
  simulating: { label: 'Simulating', icon: <Loader2 className="w-3 h-3 animate-spin" />, color: 'text-violet-400' },
  pending_review: { label: 'Review', icon: <Eye className="w-3 h-3" />, color: 'text-amber-400' },
  approved: { label: 'Approved', icon: <CheckCircle className="w-3 h-3" />, color: 'text-emerald-400' },
  executing: { label: 'Executing', icon: <Loader2 className="w-3 h-3 animate-spin" />, color: 'text-violet-400' },
  completed: { label: 'Done', icon: <CheckCircle className="w-3 h-3" />, color: 'text-emerald-400' },
  rejected: { label: 'Rejected', icon: <XCircle className="w-3 h-3" />, color: 'text-red-400' },
};

export default function IntentEngineView() {
  const intents = useIntentStore((s) => s.intents);
  const activeIntentId = useIntentStore((s) => s.activeIntentId);
  const setActiveIntent = useIntentStore((s) => s.setActiveIntent);

  const activeIntent = intents.find((i) => i.id === activeIntentId) || null;

  return (
    <div className="h-full overflow-hidden bg-slate-950 flex">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r border-slate-800 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">Intent History</h2>
          <p className="text-xs text-slate-500 mt-0.5">{intents.length} intent{intents.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 overflow-auto">
          {intents.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Brain className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No intents yet. Describe what you want to achieve.</p>
            </div>
          )}
          {intents.map((intent) => {
            const meta = statusMeta[intent.status];
            return (
              <button
                key={intent.id}
                onClick={() => setActiveIntent(intent.id)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors',
                  activeIntentId === intent.id && 'bg-slate-800/70'
                )}
              >
                <p className="text-sm text-slate-200 line-clamp-2">{intent.input}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn('flex items-center gap-1 text-xs', meta.color)}>
                    {meta.icon}
                    {meta.label}
                  </span>
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatAge(new Date(intent.createdAt))}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <SectionHeader
            icon={<Brain className="w-6 h-6 text-violet-500" />}
            title="Intent Engine"
            subtitle="Describe your desired outcome and get a visual execution plan with simulation results"
          />

          <IntentInput />

          {activeIntent && (
            <IntentDetail intent={activeIntent} />
          )}

          {!activeIntent && intents.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
              <Brain className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-300 mb-1">Express your intent</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Tell the system what you want to achieve in plain English. It will generate an execution plan,
                simulate the impact, and wait for your approval before making changes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IntentDetail({ intent }: { intent: Intent }) {
  const isExecutionPhase = intent.status === 'approved' || intent.status === 'executing' || intent.status === 'completed';

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-200">{intent.input}</p>
          <span className={cn('flex items-center gap-1 text-xs shrink-0 ml-3', statusMeta[intent.status].color)}>
            {statusMeta[intent.status].icon}
            {statusMeta[intent.status].label}
          </span>
        </div>
      </div>

      {intent.status === 'planning' && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-6 justify-center">
          <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          <span className="text-sm text-slate-400">Generating execution plan...</span>
        </div>
      )}

      {intent.status === 'simulating' && (
        <>
          <PlanViewer steps={intent.plan} />
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-6 justify-center">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            <span className="text-sm text-slate-400">Running simulation...</span>
          </div>
        </>
      )}

      {(intent.status === 'pending_review' || intent.status === 'rejected') && (
        <>
          <PlanViewer steps={intent.plan} />
          {intent.simulation && <SimulationPanel simulation={intent.simulation} />}
          <IntentActions intentId={intent.id} />
        </>
      )}

      {isExecutionPhase && (
        <>
          <ExecutionTracker intent={intent} />
          {intent.simulation && <SimulationPanel simulation={intent.simulation} />}
        </>
      )}
    </div>
  );
}
