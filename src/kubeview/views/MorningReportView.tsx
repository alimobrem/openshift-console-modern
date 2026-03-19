import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield, AlertTriangle, AlertOctagon, Server, Cpu, MemoryStick,
  HeartPulse, Clock, ArrowRight, ExternalLink, RefreshCw,
  CheckCircle, XCircle, Activity, Lock, Bell, ChevronRight,
  RotateCcw, Scale, UserCheck, FileWarning,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { k8sList } from '../engine/query';
import { queryInstant } from '../components/metrics/prometheus';
import { Panel } from '../components/primitives/Panel';
import { useNavigateTab } from '../hooks/useNavigateTab';
import { useK8sListWatch } from '../hooks/useK8sListWatch';
import { useUIStore } from '../store/uiStore';
import type { K8sResource } from '../engine/renderers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SYSTEM_NS_PREFIXES = [
  'openshift-', 'kube-', 'default', 'openshift',
];

function isSystemNamespace(ns?: string): boolean {
  if (!ns) return false;
  return SYSTEM_NS_PREFIXES.some((p) => ns === p || ns.startsWith(p + '-') || ns === p);
}

const SEVERITY_COLORS = {
  critical: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-blue-400',
} as const;

// ---------------------------------------------------------------------------
// Certificate expiry helpers
// ---------------------------------------------------------------------------

interface CertInfo {
  name: string;
  namespace: string;
  daysUntilExpiry: number | null;
  expirySource: 'cert-manager' | 'service-ca' | 'creation-estimate' | 'unknown';
}

function parseCertExpiry(secret: K8sResource): CertInfo {
  const name = secret.metadata.name;
  const namespace = secret.metadata.namespace || '';
  const annotations = secret.metadata.annotations || {};

  // 1. cert-manager annotated certs
  const certManagerExpiry = annotations['cert-manager.io/certificate-expiry'];
  if (certManagerExpiry) {
    const expiry = new Date(certManagerExpiry);
    if (!isNaN(expiry.getTime())) {
      const days = Math.floor((expiry.getTime() - Date.now()) / 86_400_000);
      return { name, namespace, daysUntilExpiry: days, expirySource: 'cert-manager' };
    }
  }

  // 2. OpenShift service-ca certs
  const serviceCaExpiry = annotations['service.beta.openshift.io/expiry'];
  if (serviceCaExpiry) {
    const expiry = new Date(serviceCaExpiry);
    if (!isNaN(expiry.getTime())) {
      const days = Math.floor((expiry.getTime() - Date.now()) / 86_400_000);
      return { name, namespace, daysUntilExpiry: days, expirySource: 'service-ca' };
    }
  }

  // 3. Estimate from creation timestamp (assume 1-year cert)
  const created = secret.metadata.creationTimestamp;
  if (created) {
    const creationDate = new Date(created);
    const estimatedExpiry = new Date(creationDate.getTime() + 365 * 86_400_000);
    const days = Math.floor((estimatedExpiry.getTime() - Date.now()) / 86_400_000);
    return { name, namespace, daysUntilExpiry: days, expirySource: 'creation-estimate' };
  }

  return { name, namespace, daysUntilExpiry: null, expirySource: 'unknown' };
}

// ---------------------------------------------------------------------------
// Risk Score SVG Ring
// ---------------------------------------------------------------------------

function RiskScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 70;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped <= 20 ? '#22c55e' :
    clamped <= 50 ? '#eab308' :
    clamped <= 75 ? '#f97316' :
    '#ef4444';

  const bgColor =
    clamped <= 20 ? 'text-green-400' :
    clamped <= 50 ? 'text-yellow-400' :
    clamped <= 75 ? 'text-orange-400' :
    'text-red-400';

  const label =
    clamped <= 20 ? 'Healthy' :
    clamped <= 50 ? 'Caution' :
    clamped <= 75 ? 'At Risk' :
    'Critical';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="180" height="180" viewBox="0 0 180 180" className="drop-shadow-lg">
        {/* Background ring */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none" stroke="#1e293b" strokeWidth={stroke}
        />
        {/* Score arc */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 90 90)"
          className="transition-all duration-1000 ease-out"
        />
        {/* Score text */}
        <text x="90" y="82" textAnchor="middle" className="fill-slate-100 text-4xl font-bold" fontSize="42">
          {clamped}
        </text>
        <text x="90" y="108" textAnchor="middle" className="fill-slate-400 text-sm" fontSize="14">
          / 100
        </text>
      </svg>
      <span className={cn('text-sm font-semibold', bgColor)}>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

function VitalCard({
  icon, label, value, subtext, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className={cn('text-2xl font-bold', color || 'text-slate-100')}>{value}</div>
      {subtext && <div className="text-xs text-slate-500">{subtext}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attention Item
// ---------------------------------------------------------------------------

interface AttentionItem {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  path: string;
  pathTitle: string;
  timestamp?: string;
}

function AttentionRow({ item, onNavigate }: { item: AttentionItem; onNavigate: (path: string, title: string) => void }) {
  const Icon = item.severity === 'critical' ? AlertOctagon : item.severity === 'warning' ? AlertTriangle : Bell;
  return (
    <button
      onClick={() => onNavigate(item.path, item.pathTitle)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-800/60 transition-colors text-left group"
    >
      <Icon className={cn('w-4 h-4 shrink-0', SEVERITY_COLORS[item.severity])} />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-200 truncate">{item.title}</div>
        <div className="text-xs text-slate-500 truncate">{item.detail}</div>
      </div>
      {item.timestamp && (
        <span className="text-xs text-slate-600 shrink-0">{item.timestamp}</span>
      )}
      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Change Summary Card
// ---------------------------------------------------------------------------

function ChangeStat({
  icon, label, count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="text-slate-400">{icon}</div>
      <div className="flex-1 text-sm text-slate-300">{label}</div>
      <span className={cn(
        'text-sm font-semibold tabular-nums',
        count > 0 ? 'text-slate-100' : 'text-slate-600',
      )}>
        {count}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main View
// ---------------------------------------------------------------------------

export default function MorningReportView() {
  const go = useNavigateTab();
  const addToast = useUIStore((s) => s.addToast);

  // ---- Live data ----
  const { data: nodes = [], isLoading: nodesLoading } = useK8sListWatch<K8sResource>({ apiPath: '/api/v1/nodes' });
  const { data: allPods = [], isLoading: podsLoading } = useK8sListWatch<K8sResource>({ apiPath: '/api/v1/pods' });

  // Cluster operators (OpenShift)
  const { data: clusterOperators = [] } = useQuery<K8sResource[]>({
    queryKey: ['k8s', 'list', '/apis/config.openshift.io/v1/clusteroperators'],
    queryFn: () => k8sList<K8sResource>('/apis/config.openshift.io/v1/clusteroperators').catch((): K8sResource[] => []),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // TLS secrets
  const { data: tlsSecrets = [] } = useQuery<K8sResource[]>({
    queryKey: ['k8s', 'list', 'tls-secrets'],
    queryFn: async (): Promise<K8sResource[]> => {
      const secrets = await k8sList<K8sResource>('/api/v1/secrets');
      return secrets.filter((s: any) => s.type === 'kubernetes.io/tls');
    },
    staleTime: 120_000,
    refetchInterval: 300_000,
  });

  // Events (last 24h)
  const { data: recentEvents = [] } = useQuery<K8sResource[]>({
    queryKey: ['k8s', 'list', 'events-24h'],
    queryFn: async () => {
      const events = await k8sList<K8sResource>('/api/v1/events');
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return events.filter((e: any) => {
        const ts = e.lastTimestamp || e.metadata.creationTimestamp;
        return ts && new Date(ts).getTime() > cutoff;
      });
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  // Prometheus: firing alerts
  type PromResult = { metric: Record<string, string>; value: number };
  const { data: firingAlerts = [] } = useQuery<PromResult[]>({
    queryKey: ['prom', 'firing-alerts'],
    queryFn: () => queryInstant('ALERTS{alertstate="firing"}').catch((): PromResult[] => []),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Prometheus: CPU %
  const { data: cpuData = [] } = useQuery<PromResult[]>({
    queryKey: ['prom', 'cluster-cpu'],
    queryFn: () => queryInstant('sum(rate(node_cpu_seconds_total{mode!="idle"}[5m])) / sum(machine_cpu_cores) * 100').catch((): PromResult[] => []),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Prometheus: Memory %
  const { data: memData = [] } = useQuery<PromResult[]>({
    queryKey: ['prom', 'cluster-memory'],
    queryFn: () => queryInstant('(1 - sum(node_memory_MemAvailable_bytes) / sum(node_memory_MemTotal_bytes)) * 100').catch((): PromResult[] => []),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // ---- Derived data ----

  const userPods = useMemo(
    () => allPods.filter((p) => !isSystemNamespace(p.metadata.namespace)),
    [allPods],
  );

  const unhealthyNodes = useMemo(
    () => nodes.filter((n: any) => {
      const conditions = n.status?.conditions || [];
      const ready = conditions.find((c: any) => c.type === 'Ready');
      return !ready || ready.status !== 'True';
    }),
    [nodes],
  );

  const degradedOperators = useMemo(
    () => clusterOperators.filter((co: any) => {
      const conditions = co.status?.conditions || [];
      const degraded = conditions.find((c: any) => c.type === 'Degraded');
      return degraded && degraded.status === 'True';
    }),
    [clusterOperators],
  );

  const failedPods = useMemo(
    () => allPods.filter((p: any) => {
      const statuses = p.status?.containerStatuses || [];
      return statuses.some((cs: any) => {
        const waiting = cs.state?.waiting?.reason;
        return waiting === 'CrashLoopBackOff' || waiting === 'ImagePullBackOff' || waiting === 'ErrImagePull';
      }) || p.status?.phase === 'Failed';
    }),
    [allPods],
  );

  const criticalAlerts = useMemo(
    () => firingAlerts.filter((a) => a.metric.severity === 'critical'),
    [firingAlerts],
  );

  const warningAlerts = useMemo(
    () => firingAlerts.filter((a) => a.metric.severity === 'warning'),
    [firingAlerts],
  );

  // Certificate analysis
  const certInfos = useMemo(() => {
    return tlsSecrets.map(parseCertExpiry).filter((c) => c.daysUntilExpiry !== null);
  }, [tlsSecrets]);

  const certsExpiringSoon7 = useMemo(
    () => certInfos.filter((c) => c.daysUntilExpiry !== null && c.daysUntilExpiry < 7),
    [certInfos],
  );

  const certsExpiringSoon30 = useMemo(
    () => certInfos.filter((c) => c.daysUntilExpiry !== null && c.daysUntilExpiry >= 7 && c.daysUntilExpiry < 30),
    [certInfos],
  );

  const topExpiring = useMemo(
    () => [...certInfos]
      .sort((a, b) => (a.daysUntilExpiry ?? 9999) - (b.daysUntilExpiry ?? 9999))
      .slice(0, 5),
    [certInfos],
  );

  // ---- Risk Score ----

  const riskScore = useMemo(() => {
    let score = 0;
    score += Math.min(40, criticalAlerts.length * 20);
    score += Math.min(20, warningAlerts.length * 5);
    score += unhealthyNodes.length * 15;
    score += degradedOperators.length * 10;
    score += certsExpiringSoon7.length * 15;
    score += certsExpiringSoon30.length * 5;
    score += Math.min(15, failedPods.length * 3);
    return Math.min(100, score);
  }, [criticalAlerts, warningAlerts, unhealthyNodes, degradedOperators, certsExpiringSoon7, certsExpiringSoon30, failedPods]);

  // ---- Attention Items ----

  const attentionItems = useMemo(() => {
    const items: AttentionItem[] = [];

    for (const co of degradedOperators) {
      items.push({
        severity: 'critical',
        title: `Operator ${co.metadata.name} is degraded`,
        detail: 'Cluster operator not functioning correctly',
        path: '/admin?tab=operators',
        pathTitle: 'Operators',
      });
    }

    for (const n of unhealthyNodes) {
      items.push({
        severity: 'critical',
        title: `Node ${n.metadata.name} is NotReady`,
        detail: 'Node is not accepting workloads',
        path: `/r/v1~nodes/${n.metadata.name}`,
        pathTitle: n.metadata.name,
      });
    }

    for (const a of criticalAlerts) {
      items.push({
        severity: 'critical',
        title: a.metric.alertname || 'Critical alert firing',
        detail: a.metric.namespace ? `in ${a.metric.namespace}` : 'cluster-scoped',
        path: '/alerts',
        pathTitle: 'Alerts',
      });
    }

    for (const p of failedPods.slice(0, 10)) {
      const reason = (p as any).status?.containerStatuses
        ?.find((cs: any) => cs.state?.waiting)?.state?.waiting?.reason || 'Error';
      items.push({
        severity: 'warning',
        title: `Pod ${p.metadata.name} — ${reason}`,
        detail: p.metadata.namespace || '',
        path: `/r/v1~pods/${p.metadata.namespace}/${p.metadata.name}`,
        pathTitle: p.metadata.name,
      });
    }

    for (const c of certsExpiringSoon7) {
      items.push({
        severity: 'critical',
        title: `Certificate ${c.name} expires in ${c.daysUntilExpiry}d`,
        detail: c.namespace,
        path: `/r/v1~secrets/${c.namespace}/${c.name}`,
        pathTitle: c.name,
      });
    }

    for (const c of certsExpiringSoon30) {
      items.push({
        severity: 'warning',
        title: `Certificate ${c.name} expires in ${c.daysUntilExpiry}d`,
        detail: c.namespace,
        path: `/r/v1~secrets/${c.namespace}/${c.name}`,
        pathTitle: c.name,
      });
    }

    // Sort: critical first, then warning, then info
    const order = { critical: 0, warning: 1, info: 2 };
    items.sort((a, b) => order[a.severity] - order[b.severity]);

    return items.slice(0, 5);
  }, [degradedOperators, unhealthyNodes, criticalAlerts, failedPods, certsExpiringSoon7, certsExpiringSoon30]);

  // ---- Cluster Vitals ----

  const cpuPct = cpuData.length > 0 ? cpuData[0].value : null;
  const memPct = memData.length > 0 ? memData[0].value : null;
  const readyNodes = nodes.filter((n: any) => {
    const ready = (n.status?.conditions || []).find((c: any) => c.type === 'Ready');
    return ready && ready.status === 'True';
  });
  const runningPods = userPods.filter((p: any) => p.status?.phase === 'Running');

  // ---- Change Summary (last 24h) ----

  const changeSummary = useMemo(() => {
    let newAlerts = 0;
    let podsRestarted = 0;
    let deploymentsScaled = 0;
    let rbacChanges = 0;

    for (const e of recentEvents) {
      const reason = (e as any).reason || '';
      const kind = (e as any).involvedObject?.kind || '';

      if (reason === 'Firing' || reason === 'AlertFiring') newAlerts++;
      if (reason === 'BackOff' || reason === 'Killing' || reason === 'Restarted') podsRestarted++;
      if ((reason === 'ScalingReplicaSet' || reason === 'SuccessfulRescale') && kind === 'Deployment') deploymentsScaled++;
      if (kind === 'RoleBinding' || kind === 'ClusterRoleBinding') rbacChanges++;
    }

    // Also count pods with high restart counts
    for (const p of allPods) {
      const statuses = (p as any).status?.containerStatuses || [];
      for (const cs of statuses) {
        if (cs.restartCount > 5) podsRestarted++;
      }
    }

    return { newAlerts, podsRestarted, deploymentsScaled, rbacChanges };
  }, [recentEvents, allPods]);

  // ---- Refresh handler ----

  const handleRefresh = () => {
    addToast({ type: 'success', title: 'Refreshing morning report data...' });
    // Queries auto-refetch; toast provides feedback
  };

  // ---- Loading state ----

  const isLoading = nodesLoading || podsLoading;

  // ---- Render ----

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-blue-400" />
            Morning Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">{dateStr} at {timeStr}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Risk Score + Attention — side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score */}
        <Panel title="Cluster Risk Score" icon={<Shield className="w-4 h-4 text-blue-400" />}>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col items-center py-2">
              <RiskScoreRing score={riskScore} />
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400">
                <span>Critical alerts: {criticalAlerts.length}</span>
                <span>Warning alerts: {warningAlerts.length}</span>
                <span>Unhealthy nodes: {unhealthyNodes.length}</span>
                <span>Degraded operators: {degradedOperators.length}</span>
                <span>Certs &lt;7d: {certsExpiringSoon7.length}</span>
                <span>Failed pods: {failedPods.length}</span>
              </div>
            </div>
          )}
        </Panel>

        {/* Needs Attention */}
        <div className="lg:col-span-2">
          <Panel title="Needs Attention" icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}>
            {attentionItems.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-slate-500">
                <CheckCircle className="w-8 h-8 mb-2 text-green-500" />
                <span className="text-sm">All clear — no items need attention</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {attentionItems.map((item, i) => (
                  <AttentionRow key={i} item={item} onNavigate={go} />
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Cluster Vitals — 4 cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Cluster Vitals
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <VitalCard
            icon={<Cpu className="w-3.5 h-3.5" />}
            label="CPU Usage"
            value={cpuPct !== null ? `${cpuPct.toFixed(1)}%` : '--'}
            subtext="Cluster average"
            color={cpuPct !== null ? (cpuPct > 85 ? 'text-red-400' : cpuPct > 70 ? 'text-amber-400' : 'text-green-400') : undefined}
          />
          <VitalCard
            icon={<MemoryStick className="w-3.5 h-3.5" />}
            label="Memory Usage"
            value={memPct !== null ? `${memPct.toFixed(1)}%` : '--'}
            subtext="Cluster average"
            color={memPct !== null ? (memPct > 85 ? 'text-red-400' : memPct > 70 ? 'text-amber-400' : 'text-green-400') : undefined}
          />
          <VitalCard
            icon={<Server className="w-3.5 h-3.5" />}
            label="Node Health"
            value={`${readyNodes.length} / ${nodes.length}`}
            subtext="Ready nodes"
            color={unhealthyNodes.length > 0 ? 'text-red-400' : 'text-green-400'}
          />
          <VitalCard
            icon={<HeartPulse className="w-3.5 h-3.5" />}
            label="Pod Health"
            value={`${runningPods.length} / ${userPods.length}`}
            subtext="Running in user namespaces"
            color={failedPods.length > 0 ? 'text-amber-400' : 'text-green-400'}
          />
        </div>
      </div>

      {/* Bottom row: Change Summary + Certificate Expiry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Summary */}
        <Panel title="Since Yesterday" icon={<Clock className="w-4 h-4 text-blue-400" />}>
          <div className="divide-y divide-slate-800/50">
            <ChangeStat
              icon={<Bell className="w-4 h-4" />}
              label="New alerts fired"
              count={changeSummary.newAlerts}
            />
            <ChangeStat
              icon={<RotateCcw className="w-4 h-4" />}
              label="Pods restarted (high restarts)"
              count={changeSummary.podsRestarted}
            />
            <ChangeStat
              icon={<Scale className="w-4 h-4" />}
              label="Deployments scaled"
              count={changeSummary.deploymentsScaled}
            />
            <ChangeStat
              icon={<UserCheck className="w-4 h-4" />}
              label="RBAC changes"
              count={changeSummary.rbacChanges}
            />
          </div>
        </Panel>

        {/* Certificate Expiry Preview */}
        <Panel title="Certificate Expiry" icon={<Lock className="w-4 h-4 text-blue-400" />}>
          {topExpiring.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-slate-500">
              <Lock className="w-6 h-6 mb-2" />
              <span className="text-sm">No TLS certificates found</span>
            </div>
          ) : (
            <div className="space-y-1">
              {topExpiring.map((cert) => {
                const days = cert.daysUntilExpiry ?? 0;
                const color = days < 7 ? 'text-red-400' : days < 30 ? 'text-amber-400' : 'text-green-400';
                const bgColor = days < 7 ? 'bg-red-500/10' : days < 30 ? 'bg-amber-500/10' : 'bg-green-500/10';
                return (
                  <button
                    key={`${cert.namespace}/${cert.name}`}
                    onClick={() => go(`/r/v1~secrets/${cert.namespace}/${cert.name}`, cert.name)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800/60 transition-colors text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-200 truncate">{cert.name}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {cert.namespace}
                        {cert.expirySource === 'creation-estimate' && ' (estimated)'}
                      </div>
                    </div>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', color, bgColor)}>
                      {cert.daysUntilExpiry !== null ? `${cert.daysUntilExpiry}d` : '?'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                  </button>
                );
              })}
              <button
                onClick={() => go('/admin?tab=certificates', 'Certificates')}
                className="w-full flex items-center justify-center gap-1 text-xs text-blue-400 hover:text-blue-300 py-2 transition-colors"
              >
                View all certificates <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
