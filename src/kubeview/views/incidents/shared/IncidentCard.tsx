import { useState, useEffect, useRef } from 'react';
import {
  XCircle, AlertTriangle, Activity, Eye, X, BellOff, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '../../../engine/formatters';
import { Card } from '../../../components/primitives/Card';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { useUIStore } from '../../../store/uiStore';
import { useAgentStore } from '../../../store/agentStore';
import type { IncidentItem, IncidentSeverity } from '../../../engine/types/incident';
import { InvestigationPhases } from './InvestigationPhases';

const DEFAULT_SILENCE_DURATION = '2h';

const SILENCE_DURATION_LABELS: Record<string, string> = {
  '30m': '30 minutes', '1h': '1 hour', '2h': '2 hours',
  '4h': '4 hours', '8h': '8 hours', '24h': '24 hours',
};

function formatSilenceDuration(d: string): string {
  return SILENCE_DURATION_LABELS[d] || d;
}

const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  critical: 'bg-red-900/50 text-red-300',
  warning: 'bg-yellow-900/50 text-yellow-300',
  info: 'bg-blue-900/50 text-blue-300',
};

export function IncidentCard({
  incident,
  focused,
  acknowledged,
  onAck,
  onOpenLifecycle,
  onDismiss,
  onSilence,
}: {
  incident: IncidentItem;
  focused?: boolean;
  acknowledged?: boolean;
  onAck?: () => void;
  onOpenLifecycle?: () => void;
  onDismiss?: () => void;
  onSilence?: (duration?: string) => void;
}) {
  const [silencing, setSilencing] = useState(false);
  const [confirmSilence, setConfirmSilence] = useState(false);
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const [silenceDuration, setSilenceDuration] = useState(DEFAULT_SILENCE_DURATION);
  const cardRef = useRef<HTMLDivElement>(null);

  const noiseScore = (incident.sourceData as Record<string, unknown>)?.noiseScore as number | undefined;
  const isNoisy = (noiseScore ?? 0) >= 0.5;

  useEffect(() => {
    if (focused) cardRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focused]);

  return (
    <div ref={cardRef}>
    <Card
      className={cn(
        focused && 'ring-1 ring-violet-500/60',
        isNoisy && 'opacity-60',
        onOpenLifecycle && 'cursor-pointer',
      )}
    >
      <div
        className="px-4 py-3 flex items-start gap-3"
        onClick={onOpenLifecycle}
        role={onOpenLifecycle ? 'button' : undefined}
        tabIndex={onOpenLifecycle ? 0 : undefined}
        onKeyDown={onOpenLifecycle ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenLifecycle(); } } : undefined}
      >
        {incident.severity === 'critical' ? (
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        ) : incident.severity === 'warning' ? (
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        ) : (
          <Activity className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium text-slate-200">{incident.title}</span>
            <span className={cn('text-xs px-1.5 py-0.5 rounded', SEVERITY_COLORS[incident.severity])}>
              {incident.severity}
            </span>
            <span className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
              {incident.source}
            </span>
            <span className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
              {incident.category}
            </span>
            {incident.autoFixable && (
              <span className="text-xs px-1.5 py-0.5 bg-emerald-900/50 text-emerald-300 rounded border border-emerald-700/40">
                Auto-fixable
              </span>
            )}
            {incident.category === 'change_risk' && (
              <span className="text-xs px-1.5 py-0.5 bg-orange-900/50 text-orange-300 rounded border border-orange-700/40">
                Deploy Risk
              </span>
            )}
            {isNoisy && (
              <span
                className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded"
                aria-description="Likely transient - noise score above threshold"
              >
                Likely transient
              </span>
            )}
            {acknowledged && (
              <span className="text-xs px-1.5 py-0.5 bg-violet-900/40 text-violet-300 rounded">
                Ack'd
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-2">{incident.detail}</p>
          {incident.resources.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {incident.resources.map((r, i) => (
                <span key={i} className="text-xs font-mono px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                  {r.kind}/{r.name}
                  {r.namespace && ` (${r.namespace})`}
                </span>
              ))}
            </div>
          )}
          {incident.investigationPhases && incident.investigationPhases.length > 0 && (
            <InvestigationPhases phases={incident.investigationPhases} planName={incident.planName} />
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{formatRelativeTime(incident.timestamp)}</span>
            {(() => {
              const runbookUrl = (incident.sourceData as Record<string, unknown>)?.annotations
                ? ((incident.sourceData as Record<string, Record<string, string>>).annotations?.runbook_url)
                : undefined;
              return runbookUrl ? (
                <a href={runbookUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  onClick={(e) => e.stopPropagation()}>
                  Runbook →
                </a>
              ) : null;
            })()}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onAck && !acknowledged && (
            <button
              onClick={(e) => { e.stopPropagation(); onAck(); }}
              className="px-2.5 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded flex items-center gap-1.5 transition-colors"
              title="Acknowledge (a)"
            >
              <Check className="w-3.5 h-3.5" />
              Ack
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              useUIStore.getState().expandAISidebar();
              useUIStore.getState().setAISidebarMode('chat');
              const { connectAndSend } = useAgentStore.getState();
              connectAndSend(
                `The monitor detected this issue:\n\n"${incident.title}: ${incident.detail}"\n\nInvestigate this further. What is the root cause and what should I do to fix it?`,
              );
            }}
            className="px-2.5 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Investigate
          </button>
          {onSilence && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmSilence(true); }}
              disabled={silencing}
              className="px-2.5 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Silence this alert for ${formatSilenceDuration(silenceDuration)}`}
            >
              <BellOff className="w-3.5 h-3.5" />
              {silencing ? 'Silencing...' : 'Silence'}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDismiss(true); }}
              className="px-2.5 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded flex items-center gap-1.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Dismiss
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmSilence}
        onClose={() => setConfirmSilence(false)}
        title="Silence Alert"
        description={`Silence "${incident.title}" for ${formatSilenceDuration(silenceDuration)}?`}
        confirmLabel="Silence"
        variant="warning"
        loading={silencing}
        onConfirm={async () => {
          if (onSilence) {
            setSilencing(true);
            try { await onSilence(silenceDuration); } finally { setSilencing(false); }
          }
          setConfirmSilence(false);
        }}
      >
        <div className="flex gap-1 mt-2">
          {['30m', '1h', '2h', '4h', '8h', '24h'].map((d) => (
            <button
              key={d}
              onClick={() => setSilenceDuration(d)}
              className={cn(
                'px-2.5 py-1 text-xs rounded transition-colors',
                silenceDuration === d
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-600/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200',
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDismiss}
        onClose={() => setConfirmDismiss(false)}
        title="Dismiss Finding"
        description="Dismiss this finding? It won't appear again until the next scan."
        confirmLabel="Dismiss"
        variant="warning"
        onConfirm={() => {
          onDismiss?.();
          setConfirmDismiss(false);
        }}
      />
    </Card>
    {focused && (
      <div className="text-[10px] text-slate-600 text-right -mt-1 mr-1">
        <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono">a</kbd> ack
        {' '} · <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono">i</kbd> investigate
        {onSilence && <> · <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono">s</kbd> silence</>}
        {onDismiss && <> · <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono">d</kbd> dismiss</>}
      </div>
    )}
    </div>
  );
}
