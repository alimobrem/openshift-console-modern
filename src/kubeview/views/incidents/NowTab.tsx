import { useMemo } from 'react';
import {
  XCircle, AlertTriangle, Activity, CheckCircle, Bell, Eye, X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Card } from '../../components/primitives/Card';
import { EmptyState } from '../../components/primitives/EmptyState';
import { useMonitorStore } from '../../store/monitorStore';
import { useUIStore } from '../../store/uiStore';
import { useAgentStore } from '../../store/agentStore';

interface PrometheusAlert {
  labels: Record<string, string>;
  annotations: Record<string, string>;
  state: 'firing' | 'pending' | 'inactive';
  activeAt?: string;
}

interface AlertGroup {
  name: string;
  rules: Array<{
    name: string;
    query: string;
    state: string;
    alerts: PrometheusAlert[];
    labels: Record<string, string>;
    annotations: Record<string, string>;
    type: string;
  }>;
}

const SEVERITY_COLORS: Record<'critical' | 'warning' | 'info', string> = {
  critical: 'bg-red-900/50 text-red-300',
  warning: 'bg-yellow-900/50 text-yellow-300',
  info: 'bg-blue-900/50 text-blue-300',
};

function formatRelativeTime(timestamp: number): string {
  const ms = Date.now() - timestamp;
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export function NowTab() {
  const findings = useMonitorStore((s) => s.findings);
  const dismissFinding = useMonitorStore((s) => s.dismissFinding);

  // Prometheus alerts
  const { data: alertGroups = [] } = useQuery<AlertGroup[]>({
    queryKey: ['alerts', 'rules'],
    queryFn: async () => {
      const res = await fetch('/api/prometheus/api/v1/rules');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data?.groups || [];
    },
    refetchInterval: 30000,
  });

  const firingAlerts = useMemo(() => {
    const alerts: Array<{
      rule: string;
      severity: string;
      description: string;
      namespace: string;
      state: string;
      activeAt?: string;
    }> = [];
    for (const group of alertGroups) {
      for (const rule of group.rules) {
        if (rule.type !== 'alerting') continue;
        for (const alert of rule.alerts || []) {
          if (alert.state === 'firing' || alert.state === 'pending') {
            alerts.push({
              rule: rule.name,
              severity: alert.labels.severity || rule.labels?.severity || 'warning',
              description: alert.annotations?.description || alert.annotations?.message || '',
              namespace: alert.labels.namespace || '',
              state: alert.state,
              activeAt: alert.activeAt,
            });
          }
        }
      }
    }
    return alerts.sort((a, b) => {
      const order: Record<string, number> = { critical: 0, warning: 1, info: 2 };
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
    });
  }, [alertGroups]);

  // Severity counts
  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const warningCount = findings.filter((f) => f.severity === 'warning').length;
  const infoCount = findings.filter((f) => f.severity === 'info').length;
  const promCritical = firingAlerts.filter((a) => a.severity === 'critical').length;
  const promWarning = firingAlerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Severity cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className={cn('bg-slate-900 rounded-lg border p-4', (criticalCount + promCritical) > 0 ? 'border-red-800' : 'border-slate-800')}>
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-slate-400">Critical</span>
          </div>
          <div className="text-2xl font-bold text-slate-100">{criticalCount + promCritical}</div>
          {promCritical > 0 && (
            <div className="text-xs text-slate-500 mt-1">{promCritical} Prometheus / {criticalCount} findings</div>
          )}
        </div>
        <div className={cn('bg-slate-900 rounded-lg border p-4', (warningCount + promWarning) > 0 ? 'border-yellow-800' : 'border-slate-800')}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-slate-400">Warning</span>
          </div>
          <div className="text-2xl font-bold text-slate-100">{warningCount + promWarning}</div>
          {promWarning > 0 && (
            <div className="text-xs text-slate-500 mt-1">{promWarning} Prometheus / {warningCount} findings</div>
          )}
        </div>
        <div className={cn('bg-slate-900 rounded-lg border p-4', infoCount > 0 ? 'border-blue-800' : 'border-slate-800')}>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-slate-400">Info</span>
          </div>
          <div className="text-2xl font-bold text-slate-100">{infoCount}</div>
        </div>
      </div>

      {/* Monitor findings */}
      {findings.length === 0 && firingAlerts.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="w-8 h-8 text-green-400" />}
          title="All clear"
          description="No active incidents. The cluster is healthy."
        />
      ) : (
        <div className="space-y-4">
          {/* Findings from monitor */}
          {findings.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-300">Monitor Findings</h2>
              {findings.map((finding) => (
                <Card key={finding.id}>
                  <div className="px-4 py-3 flex items-start gap-3">
                    {finding.severity === 'critical' ? (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    ) : finding.severity === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Activity className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-slate-200">{finding.title}</span>
                        <span className={cn('text-xs px-1.5 py-0.5 rounded', SEVERITY_COLORS[finding.severity])}>
                          {finding.severity}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                          {finding.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{finding.summary}</p>
                      {finding.resources.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {finding.resources.map((r, i) => (
                            <span key={i} className="text-xs font-mono px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                              {r.kind}/{r.name}
                              {r.namespace && ` (${r.namespace})`}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-xs text-slate-500">{formatRelativeTime(finding.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          useUIStore.getState().openDock('agent');
                          const agentStore = useAgentStore.getState();
                          if (agentStore.connected) {
                            agentStore.sendMessage(
                              `The monitor detected this issue:\n\n"${finding.title}: ${finding.summary}"\n\nInvestigate this further. What is the root cause and what should I do to fix it?`,
                            );
                          }
                        }}
                        className="px-2.5 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Investigate
                      </button>
                      <button
                        onClick={() => dismissFinding(finding.id)}
                        className="px-2.5 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded flex items-center gap-1.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Dismiss
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Prometheus alerts */}
          {firingAlerts.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-400" />
                Prometheus Alerts ({firingAlerts.length})
              </h2>
              {firingAlerts.slice(0, 20).map((alert, idx) => (
                <Card key={`${alert.rule}-${idx}`}>
                  <div className="px-4 py-3 flex items-start gap-3">
                    {alert.severity === 'critical' ? (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-slate-200">{alert.rule}</span>
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          alert.severity === 'critical' ? 'bg-red-900/50 text-red-300' : 'bg-yellow-900/50 text-yellow-300',
                        )}>
                          {alert.severity}
                        </span>
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          alert.state === 'firing' ? 'bg-red-900/50 text-red-300' : 'bg-blue-900/50 text-blue-300',
                        )}>
                          {alert.state}
                        </span>
                      </div>
                      {alert.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">{alert.description}</p>
                      )}
                      {alert.namespace && (
                        <span className="text-xs text-slate-500 mt-1 block">{alert.namespace}</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              {firingAlerts.length > 20 && (
                <p className="text-xs text-slate-500 px-1">
                  Showing 20 of {firingAlerts.length} alerts. View full list in Alerts view.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
