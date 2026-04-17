import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import {
  HeartPulse, Bell, GitPullRequest, Shield, Activity,
  Sparkles, CheckCircle, XCircle, Search, AlertTriangle, X,
  Package, Globe, Server, HardDrive, ChevronDown,
  Puzzle, Users, Hammer, History, Settings, Monitor, GitBranch,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { K8sResource } from '../engine/renderers';
import { useUIStore } from '../store/uiStore';
import { useFleetStore } from '../store/fleetStore';
import { useShallow } from 'zustand/react/shallow';
import { useMonitorStore } from '../store/monitorStore';
import { useTrustStore } from '../store/trustStore';
import { useCustomViewStore } from '../store/customViewStore';
import { useNavigateTab } from '../hooks/useNavigateTab';
import { useK8sListWatch } from '../hooks/useK8sListWatch';
import { useIncidentFeed } from '../hooks/useIncidentFeed';
import { usePrefetchOnHover } from '../hooks/usePrefetchOnHover';
import { fetchBriefing, type BriefingResponse } from '../engine/fixHistory';
import { ReportTab } from './pulse/ReportTab';
import { FleetReportTab } from './pulse/FleetReportTab';
import { AIOnboarding } from '../components/agent/AIOnboarding';
import { OvernightActivityFeed } from './pulse/OvernightActivityFeed';
import { InsightsRail } from './pulse/InsightsRail';
import { formatRelativeTime } from '../engine/formatters';

const GETTING_STARTED_KEY = 'openshiftpulse-getting-started-dismissed';

const TopologyMap = lazy(() => import('../components/topology/TopologyMap'));

type PostureLevel = 'green' | 'yellow' | 'red';

function ClusterPostureBar({
  findings,
  incidentCounts,
  lastScanTime,
  monitorConnected,
  onInvestigate,
}: {
  findings: Array<{ severity: string; title: string }>;
  incidentCounts: { critical: number; warning: number; info: number; total: number };
  lastScanTime: number | null;
  monitorConnected: boolean;
  onInvestigate: () => void;
}) {
  const criticalCount = incidentCounts.critical;
  const warningCount = incidentCounts.warning;
  const autoFixedCount = findings.filter((f) => (f as any).autoFixable).length;

  let level: PostureLevel = 'green';
  if (criticalCount > 0) level = 'red';
  else if (warningCount > 0 || findings.length > 0) level = 'yellow';

  const topFinding = findings.length > 0 ? findings[0] : null;

  const scanLabel = lastScanTime
    ? `Last scan: ${formatRelativeTime(lastScanTime)}`
    : 'No scan yet';

  const borderColor: Record<PostureLevel, string> = {
    green: 'border-l-emerald-500',
    yellow: 'border-l-amber-500',
    red: 'border-l-red-500',
  };

  const bgColor: Record<PostureLevel, string> = {
    green: 'bg-emerald-500/5',
    yellow: 'bg-amber-500/5',
    red: 'bg-red-500/5',
  };

  const iconColor: Record<PostureLevel, string> = {
    green: 'text-emerald-400',
    yellow: 'text-amber-400',
    red: 'text-red-400',
  };

  const Icon = level === 'green' ? Shield : AlertTriangle;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border-l-4 px-4 py-2 text-sm',
        borderColor[level],
        bgColor[level],
        'border border-slate-800',
      )}
    >
      <Icon className={cn('w-4 h-4 shrink-0', iconColor[level])} />
      <span className="text-slate-200 truncate">
        {level === 'green' && (
          <>
            All clear — 0 critical, 0 warnings
            <span className="text-slate-500"> | {scanLabel} | Agent: {monitorConnected ? 'healthy' : 'disconnected'}</span>
          </>
        )}
        {level === 'yellow' && (
          <>
            <span className="text-amber-400">{warningCount + findings.length} warning{warningCount + findings.length !== 1 ? 's' : ''}</span>
            {topFinding && (
              <span className="text-slate-400"> — {topFinding.title}</span>
            )}
            <span className="text-slate-500"> | {scanLabel}</span>
          </>
        )}
        {level === 'red' && (
          <>
            <span className="text-red-400">{criticalCount} critical</span>
            {topFinding && (
              <span className="text-slate-400"> — {topFinding.title}</span>
            )}
            <span className="text-slate-500"> →{' '}</span>
            <button onClick={onInvestigate} className="text-red-400 underline underline-offset-2 hover:text-red-300">
              Investigate
            </button>
            {autoFixedCount > 0 && (
              <span className="text-slate-500"> | {autoFixedCount} auto-fixed overnight</span>
            )}
          </>
        )}
      </span>
    </div>
  );
}

export default function PulseView() {
  const go = useNavigateTab();
  const selectedNamespace = useUIStore((s) => s.selectedNamespace);
  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const fleetMode = useFleetStore((s) => s.fleetMode);
  const customViews = useCustomViewStore((s) => s.views);

  const nsFilter = selectedNamespace !== '*' ? selectedNamespace : undefined;
  const { data: nodes = [], isLoading: nodesLoading } = useK8sListWatch({ apiPath: '/api/v1/nodes' });
  const { data: pods = [], isLoading: podsLoading } = useK8sListWatch({ apiPath: '/api/v1/pods', namespace: nsFilter });
  const { data: deployments = [], isLoading: deploysLoading } = useK8sListWatch({ apiPath: '/apis/apps/v1/deployments', namespace: nsFilter });
  const { data: pvcs = [], isLoading: pvcsLoading } = useK8sListWatch({ apiPath: '/api/v1/persistentvolumeclaims', namespace: nsFilter });
  const { data: operators = [], isLoading: opsLoading } = useK8sListWatch({ apiPath: '/apis/config.openshift.io/v1/clusteroperators' });
  const { data: events = [] } = useK8sListWatch({ apiPath: '/api/v1/events', namespace: nsFilter });

  const isLoading = nodesLoading || podsLoading || deploysLoading || pvcsLoading || opsLoading;
  const { pendingReviews, monitorConnected, activeSkill, monitorEnabled, setMonitorEnabled, triggerScan, findings, lastScanTime } =
    useMonitorStore(useShallow((s) => ({
      pendingReviews: s.pendingActions.length,
      monitorConnected: s.connected,
      activeSkill: s.activeSkill,
      monitorEnabled: s.monitorEnabled,
      setMonitorEnabled: s.setMonitorEnabled,
      triggerScan: s.triggerScan,
      findings: s.findings,
      lastScanTime: s.lastScanTime,
    })));
  const trustLevel = useTrustStore((s) => s.trustLevel);
  const { counts: incidentCounts } = useIncidentFeed({ limit: 0 });

  const [scanning, setScanning] = useState(false);
  const scanTimeRef = useRef(lastScanTime);
  const handleScanNow = () => {
    scanTimeRef.current = lastScanTime;
    setScanning(true);
    triggerScan();
    setTimeout(() => setScanning(false), 15_000);
  };
  useEffect(() => {
    if (scanning && lastScanTime !== scanTimeRef.current) {
      setScanning(false);
      const f = useMonitorStore.getState().findings;
      useUIStore.getState().addToast({
        type: f.length > 0 ? 'warning' : 'success',
        title: 'Scan complete',
        detail: f.length > 0
          ? `Found ${f.length} issue${f.length !== 1 ? 's' : ''}.`
          : 'No issues found — cluster looks healthy.',
        duration: 5000,
      });
    }
  }, [lastScanTime, scanning]);

  const { data: briefing } = useQuery<BriefingResponse>({
    queryKey: ['briefing'],
    queryFn: () => fetchBriefing(12),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: true,
  });

  const typedNodes = nodes as K8sResource[];
  const readyNodes = typedNodes.filter(n => {
    const conds = ((n as any).status?.conditions || []) as Array<{ type: string; status: string }>;
    return conds.some(c => c.type === 'Ready' && c.status === 'True');
  }).length;

  return (
    <div className="h-full overflow-auto bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Cluster Posture Bar ── */}
        <ClusterPostureBar
          findings={findings}
          incidentCounts={incidentCounts}
          lastScanTime={lastScanTime}
          monitorConnected={monitorConnected}
          onInvestigate={() => go('/incidents', 'Incidents')}
        />

        {/* ── Getting Started (new users only) ── */}
        <GettingStartedStrip
          go={go}
          isConnected={connectionStatus === 'connected'}
          alertCount={incidentCounts.total}
          nodeCount={typedNodes.length}
        />

        {/* ── Header with inline stats ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HeartPulse className="w-6 h-6 text-blue-500" />
            <div>
              <h1 className="text-xl font-bold text-slate-100">Cluster Pulse</h1>
              <p className="text-xs text-slate-500">
                Health overview{selectedNamespace !== '*' && <span className="text-blue-400 ml-1">· {selectedNamespace}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatPill
              icon={<Shield className="w-3 h-3" />}
              label={`${readyNodes}/${typedNodes.length} nodes`}
              color={readyNodes === typedNodes.length ? 'emerald' : 'amber'}
              onClick={() => go('/compute', 'Compute')}
            />
            {incidentCounts.total > 0 && (
              <StatPill
                icon={<Bell className="w-3 h-3" />}
                label={`${incidentCounts.total} incident${incidentCounts.total !== 1 ? 's' : ''}`}
                color={incidentCounts.critical > 0 ? 'red' : 'amber'}
                onClick={() => go('/incidents', 'Incidents')}
              />
            )}
            {pendingReviews > 0 && (
              <StatPill
                icon={<GitPullRequest className="w-3 h-3" />}
                label={`${pendingReviews} review${pendingReviews !== 1 ? 's' : ''}`}
                color="violet"
                onClick={() => go('/incidents?tab=actions', 'Review Queue')}
              />
            )}
            <button
              onClick={() => go('/agent', 'Mission Control')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <div className={cn('w-1.5 h-1.5 rounded-full', monitorConnected ? 'bg-emerald-400' : 'bg-slate-600')} />
              Agent &middot; Trust {trustLevel}
              {activeSkill && <span className="text-violet-400">&middot; {activeSkill}</span>}
            </button>
            <button
              onClick={handleScanNow}
              disabled={!monitorConnected || scanning}
              className="px-2.5 py-1 rounded bg-violet-500/10 text-xs text-violet-400 hover:bg-violet-500/20 disabled:opacity-40 flex items-center gap-1"
            >
              {scanning ? <><Activity className="w-3 h-3 animate-spin" />Scanning...</> : 'Scan Now'}
            </button>
            <button
              onClick={() => setMonitorEnabled(!monitorEnabled)}
              className={cn('px-2.5 py-1 rounded text-xs', monitorEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500')}
            >
              {monitorEnabled ? 'Monitoring On' : 'Monitoring Off'}
            </button>
          </div>
        </div>

        {/* ── AI Briefing (compact inline) ── */}
        {briefing && (
          <div className="rounded-lg border border-violet-500/20 bg-slate-900 px-4 py-3 relative overflow-hidden">
            <div className="pointer-events-none absolute -inset-px rounded-lg bg-violet-500/5" />
            <div className="relative flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300">{briefing.summary}</p>
                {(briefing.actions.completed > 0 || briefing.investigations > 0) && (
                  <div className="flex gap-3 mt-2 text-xs">
                    {briefing.actions.completed > 0 && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> {briefing.actions.completed} fixed
                      </span>
                    )}
                    {briefing.actions.failed > 0 && (
                      <span className="flex items-center gap-1 text-red-400">
                        <XCircle className="w-3 h-3" /> {briefing.actions.failed} failed
                      </span>
                    )}
                    {briefing.investigations > 0 && (
                      <span className="flex items-center gap-1 text-blue-400">
                        <Search className="w-3 h-3" /> {briefing.investigations} investigated
                      </span>
                    )}
                  </div>
                )}
                {(incidentCounts.total > 0 || findings.length > 0) && (
                  <p className="mt-2 text-xs text-slate-400">
                    Currently:{' '}
                    {incidentCounts.total > 0 && (
                      <span className={incidentCounts.critical > 0 ? 'text-red-400' : 'text-amber-400'}>
                        {incidentCounts.total} active incident{incidentCounts.total !== 1 ? 's' : ''}
                        {incidentCounts.critical > 0 && ` (${incidentCounts.critical} critical)`}
                      </span>
                    )}
                    {incidentCounts.total > 0 && findings.length > 0 && ', '}
                    {findings.length > 0 && (
                      <span className="text-violet-400">{findings.length} finding{findings.length !== 1 ? 's' : ''}</span>
                    )}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-slate-600 shrink-0">last {briefing.hours}h</span>
            </div>
          </div>
        )}

        {/* ── Two-column: main + rail ── */}
        <div className="flex gap-5">
          <div className="flex-1 min-w-0 space-y-5">
            <AIOnboarding compact className="mb-1" />

            <Suspense fallback={
              <div className="h-[420px] bg-slate-900 rounded-lg border border-slate-800 animate-pulse" />
            }>
              <TopologyMap
                nodes={nodes as K8sResource[]}
                pods={pods as K8sResource[]}
                operators={operators as K8sResource[]}
                events={events as K8sResource[]}
                go={go}
              />
            </Suspense>

            <OvernightActivityFeed />

            {fleetMode === 'multi' ? (
              <FleetReportTab />
            ) : isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-900 rounded-lg border border-slate-800 p-6 animate-pulse">
                    <div className="h-4 bg-slate-800 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-slate-800 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <ReportTab
                nodes={nodes as K8sResource[]}
                allPods={pods as K8sResource[]}
                deployments={deployments as K8sResource[]}
                pvcs={pvcs as K8sResource[]}
                operators={operators as K8sResource[]}
                go={go}
              />
            )}

          </div>

          {/* ── Right rail: always visible ── */}
          <InsightsRail className="w-60 shrink-0 hidden lg:block" onNavigate={go} />
        </div>

        {/* ── Quick Navigation ── */}
        <QuickNavigation go={go} customViews={customViews} />
      </div>
    </div>
  );
}

function StatPill({ icon, label, color, onClick }: {
  icon: React.ReactNode; label: string; color: 'emerald' | 'amber' | 'red' | 'violet'; onClick: () => void;
}) {
  const colors = {
    emerald: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10',
    amber: 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10',
    red: 'text-red-400 border-red-500/30 hover:bg-red-500/10',
    violet: 'text-violet-400 border-violet-500/30 hover:bg-violet-500/10',
  };
  return (
    <button
      onClick={onClick}
      className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors', colors[color])}
    >
      {icon}
      {label}
    </button>
  );
}

function GettingStartedStrip({ go, isConnected, alertCount, nodeCount }: {
  go: (path: string, title: string) => void;
  isConnected: boolean;
  alertCount: number;
  nodeCount: number;
}) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(GETTING_STARTED_KEY) === '1'; } catch { return false; }
  });

  if (dismissed) return null;

  const steps = [
    {
      title: 'Check cluster health',
      done: isConnected && nodeCount > 0,
      status: isConnected ? `${nodeCount} nodes connected` : 'Not connected',
      action: () => go('/compute', 'Compute'),
    },
    {
      title: 'Review incidents',
      done: alertCount === 0,
      status: alertCount > 0 ? `${alertCount} alert${alertCount !== 1 ? 's' : ''} firing` : 'All clear',
      action: () => go('/incidents', 'Incidents'),
    },
    {
      title: 'Verify production readiness',
      done: false,
      status: '30 gates across 6 categories',
      action: () => go('/readiness', 'Production Readiness'),
    },
  ];

  const allDone = steps.every((s) => s.done);

  const handleDismiss = () => {
    try { localStorage.setItem(GETTING_STARTED_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div className="rounded-lg border border-violet-800/40 bg-violet-950/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-semibold text-slate-200">
            {allDone ? 'You\'re all set!' : 'Getting Started'}
          </span>
        </div>
        <button onClick={handleDismiss} className="text-slate-500 hover:text-slate-300 transition-colors" title="Dismiss">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={step.action}
            className={cn(
              'flex items-start gap-2 px-2.5 py-2 rounded-lg border text-left transition-all hover:bg-slate-800/40',
              step.done ? 'border-emerald-800/40 bg-emerald-950/10' : 'border-slate-700/40 bg-slate-900/30',
            )}
          >
            <div className={cn('w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold',
              step.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400',
            )}>
              {step.done ? <CheckCircle className="w-3 h-3" /> : i + 1}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-200">{step.title}</div>
              <div className={cn('text-[11px] mt-0.5', step.done ? 'text-emerald-400' : 'text-slate-500')}>{step.status}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function NavTile({ icon, color, border, title, sub, onClick, path }: {
  icon: React.ReactNode; color: string; border: string; title: string; sub: string; onClick: () => void; path?: string;
}) {
  const prefetch = usePrefetchOnHover(path || '');
  const hoverProps = path ? { onMouseEnter: prefetch.onMouseEnter, onFocus: prefetch.onFocus, onMouseLeave: prefetch.onMouseLeave } : {};
  return (
    <button
      onClick={onClick}
      {...hoverProps}
      className={cn('group flex flex-col items-center gap-1.5 rounded-lg border bg-slate-900/50 px-3 py-4 hover:bg-slate-800/70 transition-all text-center', border)}
    >
      <span className={color}>{icon}</span>
      <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{title}</span>
      <span className="text-[11px] text-slate-500">{sub}</span>
    </button>
  );
}

function QuickNavigation({ go, customViews }: {
  go: (path: string, title: string) => void;
  customViews: Array<{ id: string; title: string }>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        <NavTile icon={<Bell className="w-5 h-5" />} color="text-red-400" border="border-red-500/20" title="Incidents" sub="Triage alerts, review AI fixes" onClick={() => go('/incidents', 'Incidents')} />
        <NavTile icon={<GitPullRequest className="w-5 h-5" />} color="text-violet-400" border="border-violet-500/20" title="Reviews" sub="Approve or reject AI changes" onClick={() => go('/incidents?tab=actions', 'Review Queue')} />
        <NavTile icon={<Package className="w-5 h-5" />} color="text-blue-400" border="border-blue-500/20" title="Workloads" sub="Deployments, pods, health audit" onClick={() => go('/workloads', 'Workloads')} path="/workloads" />
        <NavTile icon={<Server className="w-5 h-5" />} color="text-blue-400" border="border-slate-800" title="Compute" sub="Node health, capacity, machines" onClick={() => go('/compute', 'Compute')} path="/compute" />
        <NavTile icon={<Globe className="w-5 h-5" />} color="text-cyan-400" border="border-slate-800" title="Networking" sub="Routes, services, network policies" onClick={() => go('/networking', 'Networking')} path="/networking" />
        <NavTile icon={<HardDrive className="w-5 h-5" />} color="text-orange-400" border="border-slate-800" title="Storage" sub="PVCs, storage classes, capacity" onClick={() => go('/storage', 'Storage')} path="/storage" />
        <NavTile icon={<Shield className="w-5 h-5" />} color="text-emerald-400" border="border-emerald-500/20" title="Readiness" sub="30 production gates, 6 categories" onClick={() => go('/readiness', 'Production Readiness')} />
        <NavTile icon={<Settings className="w-5 h-5" />} color="text-slate-400" border="border-slate-800" title="Mission Control" sub="Agent config, trust, skills" onClick={() => go('/agent', 'Mission Control')} />
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors w-full"
      >
        <div className="h-px flex-1 bg-slate-800" />
        <span className="font-semibold uppercase tracking-widest">{expanded ? 'Fewer views' : 'More views'}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')} />
        <div className="h-px flex-1 bg-slate-800" />
      </button>

      {expanded && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {[
            { icon: <Globe className="w-4 h-4 text-blue-400" />, title: 'Fleet', onClick: () => go('/fleet', 'Fleet') },
            { icon: <Bell className="w-4 h-4 text-amber-400" />, title: 'Alerts', onClick: () => go('/alerts', 'Alerts') },
            { icon: <Users className="w-4 h-4 text-teal-400" />, title: 'Identity', onClick: () => go('/identity', 'Identity') },
            { icon: <Shield className="w-4 h-4 text-indigo-400" />, title: 'Security', onClick: () => go('/security', 'Security') },
            { icon: <GitBranch className="w-4 h-4 text-violet-400" />, title: 'GitOps', onClick: () => go('/gitops', 'GitOps') },
            { icon: <Settings className="w-4 h-4 text-slate-400" />, title: 'Admin', onClick: () => go('/admin', 'Administration') },
            { icon: <Hammer className="w-4 h-4 text-amber-500" />, title: 'Builds', onClick: () => go('/workloads?tab=builds', 'Workloads') },
            { icon: <Puzzle className="w-4 h-4 text-violet-400" />, title: 'CRDs', onClick: () => go('/admin?tab=crds', 'Administration') },
            { icon: <Package className="w-4 h-4 text-blue-400" />, title: 'Create', onClick: () => go('/create', 'Create Resources') },
            { icon: <History className="w-4 h-4 text-violet-400" />, title: 'Memory', onClick: () => go('/memory', "What I've Learned") },
          ].map((v) => (
            <button
              key={v.title}
              onClick={v.onClick}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800/60 bg-slate-900/50 hover:bg-slate-800/60 hover:border-slate-700 transition-all text-left text-sm text-slate-300 hover:text-slate-100"
            >
              {v.icon}
              {v.title}
            </button>
          ))}
          {customViews.map((v) => (
            <button
              key={v.id}
              onClick={() => go(`/custom/${v.id}`, v.title)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800/60 bg-slate-900/50 hover:bg-slate-800/60 hover:border-slate-700 transition-all text-left text-sm text-slate-300 hover:text-slate-100"
            >
              <Monitor className="w-4 h-4 text-violet-400" />
              {v.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
