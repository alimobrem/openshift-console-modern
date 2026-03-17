import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe, Network, Shield, ArrowRight, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { k8sList } from '../engine/query';
import type { K8sResource } from '../engine/renderers';
import { useUIStore } from '../store/uiStore';
import { useNavigateTab } from '../hooks/useNavigateTab';

function filterByNs<T extends { metadata: { namespace?: string } }>(items: T[], ns: string): T[] {
  if (ns === '*') return items;
  return items.filter((i) => i.metadata.namespace === ns);
}

export default function NetworkingView() {
  const go = useNavigateTab();
  const selectedNamespace = useUIStore((s) => s.selectedNamespace);

  const { data: services = [] } = useQuery<K8sResource[]>({
    queryKey: ['k8s', 'list', '/api/v1/services'],
    queryFn: () => k8sList('/api/v1/services'),
    refetchInterval: 30000,
  });
  const { data: ingresses = [] } = useQuery<K8sResource[]>({
    queryKey: ['k8s', 'list', '/apis/networking.k8s.io/v1/ingresses'],
    queryFn: () => k8sList('/apis/networking.k8s.io/v1/ingresses').catch(() => []),
    refetchInterval: 30000,
  });
  const { data: routes = [] } = useQuery<K8sResource[]>({
    queryKey: ['k8s', 'list', '/apis/route.openshift.io/v1/routes'],
    queryFn: () => k8sList('/apis/route.openshift.io/v1/routes').catch(() => []),
    refetchInterval: 30000,
  });
  const { data: netpols = [] } = useQuery<K8sResource[]>({
    queryKey: ['k8s', 'list', '/apis/networking.k8s.io/v1/networkpolicies'],
    queryFn: () => k8sList('/apis/networking.k8s.io/v1/networkpolicies').catch(() => []),
    refetchInterval: 30000,
  });

  const fs = filterByNs(services as any[], selectedNamespace);
  const fi = filterByNs(ingresses as any[], selectedNamespace);
  const fr = filterByNs(routes as any[], selectedNamespace);
  const fn = filterByNs(netpols as any[], selectedNamespace);

  // Service type breakdown
  const svcTypes = React.useMemo(() => {
    const types: Record<string, number> = {};
    for (const s of fs) { const t = (s as any).spec?.type || 'ClusterIP'; types[t] = (types[t] || 0) + 1; }
    return Object.entries(types).sort((a, b) => b[1] - a[1]);
  }, [fs]);

  // Exposed endpoints (routes + ingresses)
  const endpoints = React.useMemo(() => {
    const eps: Array<{ name: string; host: string; path: string; ns: string; type: 'Route' | 'Ingress'; tls: boolean }> = [];
    for (const r of fr as any[]) {
      eps.push({ name: r.metadata.name, host: r.spec?.host || '', path: r.spec?.path || '/', ns: r.metadata.namespace, type: 'Route', tls: !!r.spec?.tls });
    }
    for (const i of fi as any[]) {
      for (const rule of i.spec?.rules || []) {
        for (const path of rule.http?.paths || []) {
          eps.push({ name: i.metadata.name, host: rule.host || '', path: path.path || '/', ns: i.metadata.namespace, type: 'Ingress', tls: !!(i.spec?.tls?.length) });
        }
      }
    }
    return eps;
  }, [fr, fi]);

  return (
    <div className="h-full overflow-auto bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2"><Globe className="w-6 h-6 text-cyan-500" /> Networking</h1>
          <p className="text-sm text-slate-400 mt-1">Services, Routes, Ingresses, and Network Policies</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Services" value={fs.length} onClick={() => go('/r/v1~services', 'Services')} />
          <StatCard label="Routes" value={fr.length} onClick={() => go('/r/route.openshift.io~v1~routes', 'Routes')} />
          <StatCard label="Ingresses" value={fi.length} onClick={() => go('/r/networking.k8s.io~v1~ingresses', 'Ingresses')} />
          <StatCard label="Network Policies" value={fn.length} onClick={() => go('/r/networking.k8s.io~v1~networkpolicies', 'NetworkPolicies')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exposed Endpoints */}
          <div className="bg-slate-900 rounded-lg border border-slate-800">
            <div className="px-4 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2"><ExternalLink className="w-4 h-4 text-blue-400" /> Exposed Endpoints ({endpoints.length})</h2>
            </div>
            <div className="divide-y divide-slate-800 max-h-72 overflow-auto">
              {endpoints.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">No exposed endpoints</div>
              ) : endpoints.map((ep, i) => (
                <button key={i} onClick={() => go(`/r/${ep.type === 'Route' ? 'route.openshift.io~v1~routes' : 'networking.k8s.io~v1~ingresses'}/${ep.ns}/${ep.name}`, ep.name)}
                  className="w-full px-4 py-2 text-left hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded', ep.tls ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300')}>{ep.tls ? 'HTTPS' : 'HTTP'}</span>
                    <span className="text-sm text-blue-400 font-mono truncate">{ep.host}{ep.path}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{ep.type} · {ep.name} · {ep.ns}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Service Types */}
          <div className="bg-slate-900 rounded-lg border border-slate-800">
            <div className="px-4 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2"><Network className="w-4 h-4 text-green-400" /> Service Types</h2>
            </div>
            <div className="p-4 space-y-3">
              {svcTypes.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{type}</span>
                  <span className="text-sm font-mono text-slate-400">{count}</span>
                </div>
              ))}
              <button onClick={() => go('/r/v1~services', 'Services')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 pt-2">View all services <ArrowRight className="w-3 h-3" /></button>
            </div>
          </div>
        </div>

        {/* Namespaces without network policies */}
        {fn.length === 0 && selectedNamespace !== '*' && (
          <div className="bg-yellow-950/30 rounded-lg border border-yellow-900 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-yellow-200">No network policies in {selectedNamespace}</div>
              <div className="text-xs text-yellow-400 mt-1">Without network policies, all pods in this namespace can communicate freely. Consider adding policies to restrict traffic.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, onClick }: { label: string; value: number; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-slate-900 rounded-lg border border-slate-800 p-3 cursor-pointer hover:border-slate-600 transition-colors">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-xl font-bold text-slate-100">{value}</div>
    </div>
  );
}
