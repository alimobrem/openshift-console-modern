import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Globe, Network, Shield, ArrowRight, ExternalLink, AlertCircle,
  AlertTriangle, Info, Plus, Lock, Unlock, Server, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { k8sList } from '../engine/query';
import type { K8sResource } from '../engine/renderers';
import { useUIStore } from '../store/uiStore';
import { useNavigateTab } from '../hooks/useNavigateTab';
import { useK8sListWatch } from '../hooks/useK8sListWatch';
import { MetricCard } from '../components/metrics/Sparkline';

export default function NetworkingView() {
  const go = useNavigateTab();
  const selectedNamespace = useUIStore((s) => s.selectedNamespace);
  const nsFilter = selectedNamespace !== '*' ? selectedNamespace : undefined;

  // Real-time data
  const { data: services = [] } = useK8sListWatch({ apiPath: '/api/v1/services', namespace: nsFilter });
  const { data: ingresses = [] } = useK8sListWatch({ apiPath: '/apis/networking.k8s.io/v1/ingresses', namespace: nsFilter });
  const { data: routes = [] } = useK8sListWatch({ apiPath: '/apis/route.openshift.io/v1/routes', namespace: nsFilter });
  const { data: netpols = [] } = useK8sListWatch({ apiPath: '/apis/networking.k8s.io/v1/networkpolicies', namespace: nsFilter });

  // Cluster-scoped: endpoints, ingress controller
  const { data: endpoints = [] } = useQuery<K8sResource[]>({
    queryKey: ['networking', 'endpoints', nsFilter],
    queryFn: () => k8sList('/api/v1/endpoints', nsFilter).catch(() => []),
    staleTime: 30000,
  });
  const { data: ingressControllers = [] } = useQuery<K8sResource[]>({
    queryKey: ['networking', 'ingresscontrollers'],
    queryFn: () => k8sList('/apis/operator.openshift.io/v1/namespaces/openshift-ingress-operator/ingresscontrollers').catch(() => []),
    staleTime: 120000,
  });

  // Service type breakdown
  const svcTypes = React.useMemo(() => {
    const types: Record<string, number> = {};
    for (const s of services as any[]) {
      const t = s.spec?.type || 'ClusterIP';
      types[t] = (types[t] || 0) + 1;
    }
    return Object.entries(types).sort((a, b) => b[1] - a[1]);
  }, [services]);

  // Services without selectors (potential issues)
  const headlessServices = React.useMemo(() =>
    (services as any[]).filter(s => s.spec?.clusterIP === 'None'),
  [services]);

  const loadBalancerServices = React.useMemo(() =>
    (services as any[]).filter(s => s.spec?.type === 'LoadBalancer'),
  [services]);

  const nodePortServices = React.useMemo(() =>
    (services as any[]).filter(s => s.spec?.type === 'NodePort'),
  [services]);

  // Exposed endpoints (routes + ingresses)
  const exposedEndpoints = React.useMemo(() => {
    const eps: Array<{ name: string; host: string; path: string; ns: string; type: 'Route' | 'Ingress'; tls: boolean; admitted: boolean }> = [];
    for (const r of routes as any[]) {
      const admitted = r.status?.ingress?.some((i: any) => i.conditions?.some((c: any) => c.type === 'Admitted' && c.status === 'True'));
      eps.push({ name: r.metadata.name, host: r.spec?.host || '', path: r.spec?.path || '/', ns: r.metadata.namespace, type: 'Route', tls: !!r.spec?.tls, admitted: admitted !== false });
    }
    for (const i of ingresses as any[]) {
      for (const rule of i.spec?.rules || []) {
        for (const path of rule.http?.paths || []) {
          eps.push({ name: i.metadata.name, host: rule.host || '', path: path.path || '/', ns: i.metadata.namespace, type: 'Ingress', tls: !!(i.spec?.tls?.length), admitted: true });
        }
      }
    }
    return eps;
  }, [routes, ingresses]);

  const nonTlsEndpoints = exposedEndpoints.filter(e => !e.tls);
  const notAdmittedRoutes = (routes as any[]).filter(r => {
    const admitted = r.status?.ingress?.some((i: any) => i.conditions?.some((c: any) => c.type === 'Admitted' && c.status === 'True'));
    return admitted === false;
  });

  // Namespaces without network policies
  const namespacesWithPolicies = React.useMemo(() => {
    const nsSet = new Set<string>();
    for (const np of netpols as any[]) nsSet.add(np.metadata.namespace);
    return nsSet;
  }, [netpols]);

  // Issues
  const issues: Array<{ msg: string; severity: 'warning' | 'critical'; action?: { label: string; path: string } }> = [];
  if (nonTlsEndpoints.length > 0) issues.push({ msg: `${nonTlsEndpoints.length} endpoint${nonTlsEndpoints.length > 1 ? 's' : ''} exposed without TLS`, severity: 'warning' });
  if (notAdmittedRoutes.length > 0) issues.push({ msg: `${notAdmittedRoutes.length} route${notAdmittedRoutes.length > 1 ? 's' : ''} not admitted by ingress controller`, severity: 'critical' });
  if (netpols.length === 0) issues.push({ msg: 'No network policies configured — all pod traffic is unrestricted', severity: 'warning', action: { label: 'Create Policy', path: '/create/networking.k8s.io~v1~networkpolicies' } });
  if (nsFilter && !namespacesWithPolicies.has(nsFilter)) issues.push({ msg: `No network policies in ${nsFilter}`, severity: 'warning', action: { label: 'Create Policy', path: '/create/networking.k8s.io~v1~networkpolicies' } });

  return (
    <div className="h-full overflow-auto bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-6 h-6 text-cyan-500" /> Networking
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Services, Routes, Ingresses, and Network Policies
              {nsFilter && <span className="text-blue-400 ml-1">in {nsFilter}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => go('/create/v1~services', 'Create Service')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors">
              <Plus className="w-3 h-3" /> Create Service
            </button>
          </div>
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <div className="space-y-2">
            {issues.map((issue, i) => (
              <div key={i} className={cn('flex items-center justify-between px-4 py-2.5 rounded-lg border',
                issue.severity === 'critical' ? 'bg-red-950/30 border-red-900' : 'bg-yellow-950/30 border-yellow-900')}>
                <div className="flex items-center gap-2">
                  {issue.severity === 'critical' ? <AlertCircle className="w-4 h-4 text-red-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  <span className="text-sm text-slate-200">{issue.msg}</span>
                </div>
                {issue.action && (
                  <button onClick={() => go(issue.action!.path, issue.action!.label)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    {issue.action.label} <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button onClick={() => go('/r/v1~services', 'Services')} className="bg-slate-900 rounded-lg border border-slate-800 p-3 text-left hover:border-slate-600 transition-colors">
            <div className="text-xs text-slate-400 mb-1">Services</div>
            <div className="text-xl font-bold text-slate-100">{services.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">{svcTypes.map(([t, c]) => `${c} ${t}`).slice(0, 2).join(' · ')}</div>
          </button>
          <button onClick={() => go('/r/route.openshift.io~v1~routes', 'Routes')} className="bg-slate-900 rounded-lg border border-slate-800 p-3 text-left hover:border-slate-600 transition-colors">
            <div className="text-xs text-slate-400 mb-1">Routes</div>
            <div className="text-xl font-bold text-slate-100">{routes.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">{exposedEndpoints.filter(e => e.type === 'Route' && e.tls).length} TLS</div>
          </button>
          <button onClick={() => go('/r/networking.k8s.io~v1~ingresses', 'Ingresses')} className="bg-slate-900 rounded-lg border border-slate-800 p-3 text-left hover:border-slate-600 transition-colors">
            <div className="text-xs text-slate-400 mb-1">Ingresses</div>
            <div className="text-xl font-bold text-slate-100">{ingresses.length}</div>
          </button>
          <button onClick={() => go('/r/networking.k8s.io~v1~networkpolicies', 'NetworkPolicies')} className={cn('bg-slate-900 rounded-lg border p-3 text-left hover:border-slate-600 transition-colors', netpols.length === 0 ? 'border-yellow-800' : 'border-slate-800')}>
            <div className="text-xs text-slate-400 mb-1">Network Policies</div>
            <div className="text-xl font-bold text-slate-100">{netpols.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">{netpols.length === 0 ? 'None configured' : `${namespacesWithPolicies.size} ns covered`}</div>
          </button>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
            <div className="text-xs text-slate-400 mb-1">Endpoints</div>
            <div className="text-xl font-bold text-slate-100">{exposedEndpoints.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">{nonTlsEndpoints.length > 0 ? `${nonTlsEndpoints.length} no TLS` : 'All secured'}</div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            title="Network Receive"
            query="sum(rate(node_network_receive_bytes_total{device!~'lo|veth.*|br.*'}[5m])) / 1024 / 1024"
            unit=" MB/s"
            color="#06b6d4"
          />
          <MetricCard
            title="Network Transmit"
            query="sum(rate(node_network_transmit_bytes_total{device!~'lo|veth.*|br.*'}[5m])) / 1024 / 1024"
            unit=" MB/s"
            color="#8b5cf6"
          />
          <MetricCard
            title="TCP Connections"
            query="sum(node_netstat_Tcp_CurrEstab)"
            unit=""
            color="#3b82f6"
          />
          <MetricCard
            title="Network Errors"
            query="sum(rate(node_network_receive_errs_total[5m]) + rate(node_network_transmit_errs_total[5m]))"
            unit=" /s"
            color="#ef4444"
            thresholds={{ warning: 1, critical: 10 }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exposed Endpoints */}
          <Panel title={`Exposed Endpoints (${exposedEndpoints.length})`} icon={<ExternalLink className="w-4 h-4 text-blue-400" />}>
            {exposedEndpoints.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500">No exposed endpoints</div>
            ) : (
              <div className="divide-y divide-slate-800 max-h-80 overflow-auto">
                {exposedEndpoints.map((ep, i) => (
                  <button key={i} onClick={() => go(`/r/${ep.type === 'Route' ? 'route.openshift.io~v1~routes' : 'networking.k8s.io~v1~ingresses'}/${ep.ns}/${ep.name}`, ep.name)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {ep.tls ? <Lock className="w-3 h-3 text-green-400 shrink-0" /> : <Unlock className="w-3 h-3 text-amber-400 shrink-0" />}
                        <span className="text-sm text-blue-400 font-mono truncate">{ep.host}{ep.path !== '/' ? ep.path : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span className={cn('px-1 py-0.5 rounded', ep.type === 'Route' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400')}>{ep.type}</span>
                        <span>{ep.name}</span>
                        <span className="text-slate-600">{ep.ns}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </Panel>

          {/* Service Types breakdown */}
          <Panel title="Service Types" icon={<Network className="w-4 h-4 text-green-400" />}>
            <div className="space-y-3">
              {svcTypes.map(([type, count]) => {
                const maxCount = Math.max(...svcTypes.map(([, c]) => c), 1);
                const pct = (count / maxCount) * 100;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">{type}</span>
                      <span className="text-sm font-mono text-slate-400">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {svcTypes.length === 0 && <div className="text-sm text-slate-500 text-center py-4">No services</div>}
            </div>

            {/* LoadBalancer + NodePort details */}
            {loadBalancerServices.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="text-xs text-slate-500 font-medium mb-2">LoadBalancer Services</div>
                {(loadBalancerServices as any[]).map((svc) => {
                  const lbIP = svc.status?.loadBalancer?.ingress?.[0]?.hostname || svc.status?.loadBalancer?.ingress?.[0]?.ip || 'Pending';
                  return (
                    <button key={svc.metadata.uid} onClick={() => go(`/r/v1~services/${svc.metadata.namespace}/${svc.metadata.name}`, svc.metadata.name)}
                      className="flex items-center justify-between w-full py-1.5 px-2 rounded hover:bg-slate-800/50 text-left transition-colors">
                      <span className="text-xs text-slate-300">{svc.metadata.name}</span>
                      <span className="text-xs font-mono text-slate-500">{lbIP}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* Ingress Controllers */}
        {ingressControllers.length > 0 && (
          <Panel title="Ingress Controllers" icon={<Server className="w-4 h-4 text-blue-400" />}>
            <div className="space-y-2">
              {(ingressControllers as any[]).map((ic) => {
                const available = ic.status?.conditions?.find((c: any) => c.type === 'Available');
                const isAvailable = available?.status === 'True';
                const domain = ic.status?.domain || ic.spec?.domain || '';
                const replicas = ic.status?.availableReplicas ?? '?';
                return (
                  <div key={ic.metadata.uid} className="flex items-center justify-between py-2.5 px-3 rounded hover:bg-slate-800/50">
                    <div>
                      <div className="flex items-center gap-2">
                        {isAvailable ? <Activity className="w-3.5 h-3.5 text-green-400" /> : <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                        <span className="text-sm font-medium text-slate-200">{ic.metadata.name}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded', isAvailable ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300')}>{isAvailable ? 'Available' : 'Degraded'}</span>
                      </div>
                      {domain && <div className="text-xs text-slate-500 mt-0.5 font-mono">*.{domain}</div>}
                    </div>
                    <span className="text-xs text-slate-500">{replicas} replicas</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}

        {/* Not Admitted Routes */}
        {notAdmittedRoutes.length > 0 && (
          <Panel title={`Not Admitted Routes (${notAdmittedRoutes.length})`} icon={<AlertCircle className="w-4 h-4 text-red-500" />}>
            <div className="space-y-1">
              {(notAdmittedRoutes as any[]).map((r) => (
                <button key={r.metadata.uid} onClick={() => go(`/r/route.openshift.io~v1~routes/${r.metadata.namespace}/${r.metadata.name}`, r.metadata.name)}
                  className="flex items-center justify-between w-full py-2 px-3 rounded hover:bg-slate-800/50 text-left transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm text-slate-200">{r.metadata.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">{r.metadata.namespace}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{r.spec?.host || '—'}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-500 space-y-1">
                <p className="font-medium text-slate-400">Common causes:</p>
                <p>1. Host conflicts with another Route in the same namespace</p>
                <p>2. Ingress controller not configured for the Route's domain</p>
                <p>3. TLS certificate issues (missing or invalid Secret)</p>
              </div>
            </div>
          </Panel>
        )}

        {/* Network Policies summary */}
        <Panel title="Network Policies" icon={<Shield className="w-4 h-4 text-indigo-400" />}>
          {netpols.length === 0 ? (
            <div className="text-center py-4">
              <Shield className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No network policies configured</p>
              <p className="text-xs text-slate-600 mt-1">All pod-to-pod traffic is allowed by default</p>
              <button onClick={() => go('/create/networking.k8s.io~v1~networkpolicies', 'Create NetworkPolicy')}
                className="mt-3 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors">
                Create Network Policy
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {(netpols as any[]).slice(0, 10).map((np) => {
                const ingressRules = np.spec?.ingress?.length || 0;
                const egressRules = np.spec?.egress?.length || 0;
                const policyTypes = np.spec?.policyTypes || [];
                return (
                  <button key={np.metadata.uid} onClick={() => go(`/r/networking.k8s.io~v1~networkpolicies/${np.metadata.namespace}/${np.metadata.name}`, np.metadata.name)}
                    className="flex items-center justify-between w-full py-2 px-3 rounded hover:bg-slate-800/50 text-left transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-200">{np.metadata.name}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">{np.metadata.namespace}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                        {policyTypes.includes('Ingress') && <span>{ingressRules} ingress rule{ingressRules !== 1 ? 's' : ''}</span>}
                        {policyTypes.includes('Egress') && <span>{egressRules} egress rule{egressRules !== 1 ? 's' : ''}</span>}
                        {policyTypes.length === 0 && <span>{ingressRules} ingress rule{ingressRules !== 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                  </button>
                );
              })}
              {netpols.length > 10 && (
                <button onClick={() => go('/r/networking.k8s.io~v1~networkpolicies', 'NetworkPolicies')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 pt-1">
                  View all {netpols.length} <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </Panel>

        {/* Guidance */}
        <Panel title="Networking Best Practices" icon={<Info className="w-4 h-4 text-blue-500" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium text-slate-200">Use TLS on all Routes</span>
                  <p className="text-slate-500">Set <code className="text-slate-400">spec.tls.termination: edge</code> for automatic certificate management</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium text-slate-200">Apply network policies per namespace</span>
                  <p className="text-slate-500">Default-deny ingress + allow specific traffic patterns. Start with deny-all then whitelist.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium text-slate-200">Use custom ingress certificates</span>
                  <p className="text-slate-500">Replace the default wildcard certificate with your organization's CA-signed certificate</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium text-slate-200">Avoid NodePort services in production</span>
                  <p className="text-slate-500">Use Routes or LoadBalancer services. NodePorts expose ports on every node.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium text-slate-200">Monitor network errors</span>
                  <p className="text-slate-500">Alert on <code className="text-slate-400">node_network_receive_errs_total</code> — persistent errors indicate NIC or switch issues</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium text-slate-200">Use egress network policies</span>
                  <p className="text-slate-500">Restrict outbound traffic to prevent data exfiltration and limit blast radius</p>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800">
      <div className="px-4 py-3 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">{icon}{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
