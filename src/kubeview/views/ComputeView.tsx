import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Server, Cpu, HardDrive, Activity, CheckCircle, XCircle, AlertCircle,
  ArrowRight, Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { k8sList } from '../engine/query';
import { queryInstant } from '../components/metrics/prometheus';
import type { K8sResource } from '../engine/renderers';
import { getNodeStatus } from '../engine/renderers/statusUtils';
import { useNavigateTab } from '../hooks/useNavigateTab';

export default function ComputeView() {
  const go = useNavigateTab();

  const { data: nodes = [] } = useQuery<K8sResource[]>({
    queryKey: ['k8s', 'list', '/api/v1/nodes'],
    queryFn: () => k8sList('/api/v1/nodes'),
    refetchInterval: 30000,
  });

  const { data: machines = [] } = useQuery<K8sResource[]>({
    queryKey: ['k8s', 'list', '/apis/machine.openshift.io/v1beta1/machines'],
    queryFn: () => k8sList('/apis/machine.openshift.io/v1beta1/machines').catch(() => []),
    staleTime: 60000,
  });

  const { data: machineSets = [] } = useQuery<K8sResource[]>({
    queryKey: ['k8s', 'list', '/apis/machine.openshift.io/v1beta1/machinesets'],
    queryFn: () => k8sList('/apis/machine.openshift.io/v1beta1/machinesets').catch(() => []),
    staleTime: 60000,
  });

  // Metrics
  const { data: cpuMetrics } = useQuery({
    queryKey: ['compute', 'cpu'],
    queryFn: () => queryInstant('sum(rate(node_cpu_seconds_total{mode!="idle"}[5m])) / sum(machine_cpu_cores) * 100').catch(() => []),
    refetchInterval: 30000,
  });
  const { data: memMetrics } = useQuery({
    queryKey: ['compute', 'memory'],
    queryFn: () => queryInstant('(1 - sum(node_memory_MemAvailable_bytes) / sum(node_memory_MemTotal_bytes)) * 100').catch(() => []),
    refetchInterval: 30000,
  });

  const cpuPercent = cpuMetrics?.[0]?.value ?? null;
  const memPercent = memMetrics?.[0]?.value ?? null;

  const readyNodes = nodes.filter((n) => getNodeStatus(n).ready).length;
  const unreadyNodes = nodes.filter((n) => !getNodeStatus(n).ready);

  // Node roles
  const nodesByRole = React.useMemo(() => {
    const roles = new Map<string, K8sResource[]>();
    for (const n of nodes) {
      const labels = n.metadata.labels || {};
      const nodeRoles = Object.keys(labels).filter(k => k.startsWith('node-role.kubernetes.io/')).map(k => k.replace('node-role.kubernetes.io/', ''));
      if (nodeRoles.length === 0) nodeRoles.push('worker');
      for (const role of nodeRoles) {
        if (!roles.has(role)) roles.set(role, []);
        roles.get(role)!.push(n);
      }
    }
    return [...roles.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [nodes]);

  return (
    <div className="h-full overflow-auto bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2"><Server className="w-6 h-6 text-blue-500" /> Compute</h1>
          <p className="text-sm text-slate-400 mt-1">Nodes, machines, and cluster capacity</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={cn('bg-slate-900 rounded-lg border p-3', unreadyNodes.length > 0 ? 'border-yellow-800' : 'border-slate-800')}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Nodes</span>
              {unreadyNodes.length > 0 ? <span className="text-xs px-1.5 py-0.5 bg-red-900 text-red-300 rounded">{unreadyNodes.length}</span> : <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
            </div>
            <div className="text-xl font-bold text-slate-100">{readyNodes}/{nodes.length}</div>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
            <div className="text-xs text-slate-400 mb-1">CPU</div>
            <div className="text-xl font-bold text-slate-100">{cpuPercent !== null ? `${Math.round(cpuPercent)}%` : '—'}</div>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
            <div className="text-xs text-slate-400 mb-1">Memory</div>
            <div className="text-xl font-bold text-slate-100">{memPercent !== null ? `${Math.round(memPercent)}%` : '—'}</div>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 cursor-pointer hover:border-slate-600" onClick={() => go('/r/machine.openshift.io~v1beta1~machinesets', 'MachineSets')}>
            <div className="text-xs text-slate-400 mb-1">MachineSets</div>
            <div className="text-xl font-bold text-slate-100">{machineSets.length}</div>
          </div>
        </div>

        {/* Unready nodes */}
        {unreadyNodes.length > 0 && (
          <div className="bg-red-950/30 rounded-lg border border-red-900 p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> Unready Nodes ({unreadyNodes.length})</h2>
            {unreadyNodes.map((n) => (
              <button key={n.metadata.uid} onClick={() => go(`/r/v1~nodes/_/${n.metadata.name}`, n.metadata.name)}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-800/50 text-left">
                <span className="text-sm text-slate-200">{n.metadata.name}</span>
                <span className="text-xs px-2 py-0.5 bg-red-900/50 text-red-300 rounded">NotReady</span>
              </button>
            ))}
          </div>
        )}

        {/* Nodes by role */}
        <div className="bg-slate-900 rounded-lg border border-slate-800">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Nodes</h2>
            <button onClick={() => go('/r/v1~nodes', 'Nodes')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="divide-y divide-slate-800">
            {nodesByRole.map(([role, roleNodes]) => (
              <div key={role} className="px-4 py-3">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">{role} ({roleNodes.length})</div>
                <div className="space-y-1">
                  {roleNodes.map((node) => {
                    const status = getNodeStatus(node);
                    const nodeInfo = (node.status as any)?.nodeInfo || {};
                    const taints = ((node.spec as any)?.taints || []) as any[];
                    const unschedulable = (node.spec as any)?.unschedulable;
                    return (
                      <button key={node.metadata.uid} onClick={() => go(`/r/v1~nodes/_/${node.metadata.name}`, node.metadata.name)}
                        className="w-full flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-800/50 text-left">
                        <div className="flex items-center gap-2 min-w-0">
                          {status.ready ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          <span className="text-sm text-slate-200 truncate">{node.metadata.name}</span>
                          {unschedulable && <span className="text-[10px] px-1 py-0.5 bg-yellow-900 text-yellow-300 rounded">Cordoned</span>}
                          {taints.length > 0 && <span className="text-[10px] text-slate-600 flex items-center gap-0.5"><Ban className="w-3 h-3" />{taints.length}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{nodeInfo.kubeletVersion}</span>
                          <span>{nodeInfo.operatingSystem}/{nodeInfo.architecture}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
