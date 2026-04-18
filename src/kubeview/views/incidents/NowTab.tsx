import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '../../components/primitives/Card';
import { EmptyState } from '../../components/primitives/EmptyState';
import { useIncidentFeed } from '../../hooks/useIncidentFeed';
import { useMonitorStore } from '../../store/monitorStore';
import { useUIStore } from '../../store/uiStore';
import { useAgentStore } from '../../store/agentStore';
import { showErrorToast } from '../../engine/errorToast';
import { IncidentCard } from './shared/IncidentCard';
import { IncidentLifecycleDrawer } from './IncidentLifecycleDrawer';

const DEFAULT_SILENCE_DURATION = '2h';

const SILENCE_DURATION_LABELS: Record<string, string> = {
  '30m': '30 minutes', '1h': '1 hour', '2h': '2 hours',
  '4h': '4 hours', '8h': '8 hours', '24h': '24 hours', '1d': '1 day',
};

function formatSilenceDuration(d: string): string {
  return SILENCE_DURATION_LABELS[d] || d;
}

async function createQuickSilence(
  alertName: string,
  duration = DEFAULT_SILENCE_DURATION,
  namespace?: string,
  severity?: string,
) {
  const durationMatch = duration.match(/^(\d+)(m|h|d)$/);
  let durationMs = 2 * 60 * 60 * 1000;
  if (durationMatch) {
    const value = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2];
    if (unit === 'm') durationMs = value * 60 * 1000;
    else if (unit === 'h') durationMs = value * 60 * 60 * 1000;
    else if (unit === 'd') durationMs = value * 24 * 60 * 60 * 1000;
  }
  const endsAt = new Date(Date.now() + durationMs).toISOString();
  const matchers = [{ name: 'alertname', value: alertName, isRegex: false }];
  if (namespace) matchers.push({ name: 'namespace', value: namespace, isRegex: false });
  if (severity) matchers.push({ name: 'severity', value: severity, isRegex: false });
  const res = await fetch('/api/alertmanager/api/v2/silences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      matchers,
      startsAt: new Date().toISOString(),
      endsAt,
      createdBy: useUIStore.getState().impersonateUser || 'pulse-ui',
      comment: `Quick silence from Incident Center (${formatSilenceDuration(duration)})`,
    }),
  });
  if (!res.ok) throw new Error('Failed to create silence');
}

type TriageFilter = 'all' | 'new' | 'acknowledged' | 'investigating' | 'auto-fixable';

const TRIAGE_FILTERS: { id: TriageFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'acknowledged', label: 'Acknowledged' },
  { id: 'investigating', label: 'Investigating' },
  { id: 'auto-fixable', label: 'Auto-fixable' },
];

export function NowTab() {
  const dismissFinding = useMonitorStore((s) => s.dismissFinding);
  const acknowledgeFinding = useMonitorStore((s) => s.acknowledgeFinding);
  const unacknowledgeFinding = useMonitorStore((s) => s.unacknowledgeFinding);
  const acknowledgedIds = useMonitorStore((s) => s.acknowledgedIds);
  const queryClient = useQueryClient();
  const { incidents, isLoading } = useIncidentFeed();
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [triageFilter, setTriageFilter] = useState<TriageFilter>('all');
  const [undoAckId, setUndoAckId] = useState<string | null>(null);
  const [lifecycleFindingId, setLifecycleFindingId] = useState<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); };
  }, []);

  useEffect(() => {
    const findingId = new URLSearchParams(window.location.search).get('finding');
    if (findingId && incidents.length > 0) {
      const idx = incidents.findIndex((i) => i.id === findingId || i.sourceRef === findingId);
      if (idx >= 0) setFocusedIdx(idx);
    }
  }, [incidents]);

  const handleAck = useCallback((id: string) => {
    acknowledgeFinding(id);
    setUndoAckId(id);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoAckId(null), 5000);
  }, [acknowledgeFinding]);

  const handleUndoAck = useCallback(() => {
    if (undoAckId) {
      unacknowledgeFinding(undoAckId);
      setUndoAckId(null);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    }
  }, [undoAckId, unacknowledgeFinding]);

  const sortedIncidents = useMemo(() => {
    const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    return [...incidents].sort((a, b) => {
      const sevA = severityOrder[a.severity] ?? 3;
      const sevB = severityOrder[b.severity] ?? 3;
      if (sevA !== sevB) return sevA - sevB;
      const noiseA = (a.sourceData as Record<string, unknown>)?.noiseScore as number | undefined;
      const noiseB = (b.sourceData as Record<string, unknown>)?.noiseScore as number | undefined;
      const isNoisyA = (noiseA ?? 0) >= 0.5 ? 1 : 0;
      const isNoisyB = (noiseB ?? 0) >= 0.5 ? 1 : 0;
      if (isNoisyA !== isNoisyB) return isNoisyA - isNoisyB;
      return b.timestamp - a.timestamp;
    });
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    let list = sortedIncidents;
    if (triageFilter !== 'all') {
      list = list.filter((inc) => {
        switch (triageFilter) {
          case 'new': return inc.freshness === 'new';
          case 'acknowledged': return acknowledgedIds.includes(inc.id);
          case 'investigating': return inc.investigationPhases?.some((p) => p.status === 'running');
          case 'auto-fixable': return inc.autoFixable;
        }
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((inc) =>
        inc.title.toLowerCase().includes(q) || inc.detail.toLowerCase().includes(q) ||
        inc.category.toLowerCase().includes(q) || (inc.namespace || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [sortedIncidents, triageFilter, acknowledgedIds, searchQuery]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (document.querySelector('[role="dialog"]')) return;
      if (filteredIncidents.length === 0) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIdx((prev) => Math.min(prev + 1, filteredIncidents.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIdx((prev) => Math.max(prev - 1, 0));
      } else if (focusedIdx >= 0 && focusedIdx < filteredIncidents.length) {
        const incident = filteredIncidents[focusedIdx];
        if (e.key === 'i') {
          e.preventDefault();
          useUIStore.getState().expandAISidebar();
          useUIStore.getState().setAISidebarMode('chat');
          const agentStore = useAgentStore.getState();
          if (agentStore.connected) {
            agentStore.sendMessage(`The monitor detected this issue:\n\n"${incident.title}: ${incident.detail}"\n\nInvestigate this further. What is the root cause and what should I do to fix it?`);
          }
        } else if (e.key === 's' && incident.source === 'prometheus-alert') {
          e.preventDefault();
          handleSilence(incident.title);
        } else if (e.key === 'd' && incident.source === 'finding') {
          e.preventDefault();
          dismissFinding(incident.id);
        } else if (e.key === 'a') {
          e.preventDefault();
          if (acknowledgedIds.includes(incident.id)) unacknowledgeFinding(incident.id);
          else handleAck(incident.id);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [filteredIncidents, focusedIdx, acknowledgedIds]);

  const handleSilence = async (alertName: string, duration = DEFAULT_SILENCE_DURATION, namespace?: string, severity?: string) => {
    const addToast = useUIStore.getState().addToast;
    try {
      await createQuickSilence(alertName, duration, namespace, severity);
      addToast({ type: 'success', title: 'Silence created', detail: `${alertName} silenced for ${formatSilenceDuration(duration)}` });
      queryClient.invalidateQueries({ queryKey: ['incidents', 'silences'] });
    } catch (err: unknown) {
      showErrorToast(err, 'Failed to create silence');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Card className="flex gap-1 p-1">
          {TRIAGE_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTriageFilter(id)}
              className={cn('px-3 py-1.5 text-xs rounded transition-colors', triageFilter === id ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200')}
            >
              {label}
              {id === 'all' && incidents.length > 0 && <span className="ml-1 text-[10px] opacity-60">{incidents.length}</span>}
            </button>
          ))}
        </Card>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter incidents..." aria-label="Filter incidents"
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
      </div>

      {undoAckId && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">Incident acknowledged</span>
          <button onClick={handleUndoAck} className="ml-auto px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors">Undo</button>
        </div>
      )}

      {isLoading && incidents.length === 0 ? (
        <div className="flex items-center justify-center h-48"><span className="text-slate-500 text-sm">Loading incidents...</span></div>
      ) : filteredIncidents.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="w-8 h-8 text-green-400" />}
          title={triageFilter === 'all' ? 'All clear' : 'No matching incidents'}
          description={triageFilter === 'all' ? 'No active incidents. The cluster is healthy.' : `No incidents match the "${triageFilter}" filter.`}
        />
      ) : (
        <div className="space-y-2" ref={listRef}>
          {filteredIncidents.map((incident, idx) => (
            <IncidentCard
              key={incident.id} incident={incident} focused={idx === focusedIdx}
              acknowledged={acknowledgedIds.includes(incident.id)}
              onAck={() => handleAck(incident.id)}
              onOpenLifecycle={incident.source === 'finding' ? () => setLifecycleFindingId(incident.id) : undefined}
              onDismiss={incident.source === 'finding' ? () => dismissFinding(incident.id) : undefined}
              onSilence={incident.source === 'prometheus-alert' ? (duration?: string) => handleSilence(incident.title, duration, incident.namespace, incident.severity) : undefined}
            />
          ))}
        </div>
      )}

      {lifecycleFindingId && (
        <IncidentLifecycleDrawer findingId={lifecycleFindingId} onClose={() => setLifecycleFindingId(null)} />
      )}
    </div>
  );
}
