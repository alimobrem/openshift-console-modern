import { Check, X, RefreshCw } from 'lucide-react';
import { useIntentStore } from '../../store/intentStore';

interface IntentActionsProps {
  intentId: string;
}

export function IntentActions({ intentId }: IntentActionsProps) {
  const approveIntent = useIntentStore((s) => s.approveIntent);
  const rejectIntent = useIntentStore((s) => s.rejectIntent);
  const intent = useIntentStore((s) => s.intents.find((i) => i.id === intentId));

  if (!intent || intent.status !== 'pending_review') return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => approveIntent(intentId)}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
      >
        <Check className="w-4 h-4" />
        Approve
      </button>
      <button
        onClick={() => {
          /* Tweak would reopen the input with context — placeholder for now */
        }}
        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Tweak
      </button>
      <button
        onClick={() => rejectIntent(intentId)}
        className="flex items-center gap-1.5 rounded-lg border border-red-800/40 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/30 transition-colors"
      >
        <X className="w-4 h-4" />
        Reject
      </button>
    </div>
  );
}
