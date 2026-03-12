import React, { useState, useEffect, useMemo } from 'react';
import { PageSection, Title, Card, CardBody, Grid, GridItem, Label, Progress, ProgressVariant } from '@patternfly/react-core';
import { useNavigate } from 'react-router-dom';

const BASE = '/api/kubernetes';

interface NamespaceCost {
  namespace: string;
  podCount: number;
  cpuCores: number;
  memoryGi: number;
  cpuCostPerHour: number;
  memoryCostPerHour: number;
  totalCostPerHour: number;
  monthlyCost: number;
  percentOfTotal: number;
}

interface ClusterCostSummary {
  totalNodes: number;
  totalCpuCores: number;
  totalMemoryGi: number;
  totalMonthlyCost: number;
  namespaces: NamespaceCost[];
}

// Approximate pricing per core-hour and GB-hour (adjust for your cloud)
const CPU_COST_PER_CORE_HOUR = 0.035; // ~$25/mo per core
const MEMORY_COST_PER_GI_HOUR = 0.005; // ~$3.6/mo per Gi

function parseCpu(v: string): number {
  if (v.endsWith('m')) return parseFloat(v) / 1000;
  return parseFloat(v);
}

function parseMem(v: string): number {
  if (v.endsWith('Gi')) return parseFloat(v);
  if (v.endsWith('Mi')) return parseFloat(v) / 1024;
  if (v.endsWith('Ki')) return parseFloat(v) / (1024 * 1024);
  return parseFloat(v) / (1024 * 1024 * 1024);
}

export default function CostDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ClusterCostSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const nsCosts = new Map<string, { pods: number; cpu: number; mem: number }>();
      let totalCpu = 0, totalMem = 0, totalNodes = 0;

      // Fetch nodes for cluster totals
      try {
        const res = await fetch(`${BASE}/api/v1/nodes`);
        if (res.ok) {
          const data = await res.json() as { items: { status: { capacity: { cpu: string; memory: string } } }[] };
          totalNodes = data.items.length;
          for (const node of data.items) {
            totalCpu += parseCpu(node.status.capacity.cpu);
            totalMem += parseMem(node.status.capacity.memory);
          }
        }
      } catch { /* ignore */ }

      // Fetch pods and aggregate requests by namespace
      try {
        const res = await fetch(`${BASE}/api/v1/pods`);
        if (res.ok) {
          const data = await res.json() as { items: { metadata: { namespace: string }; spec: { containers: { resources?: { requests?: { cpu?: string; memory?: string } } }[] }; status: { phase: string } }[] };
          for (const pod of data.items) {
            if (pod.status.phase !== 'Running') continue;
            const ns = pod.metadata.namespace;
            const entry = nsCosts.get(ns) ?? { pods: 0, cpu: 0, mem: 0 };
            entry.pods++;
            for (const c of pod.spec.containers) {
              if (c.resources?.requests?.cpu) entry.cpu += parseCpu(c.resources.requests.cpu);
              if (c.resources?.requests?.memory) entry.mem += parseMem(c.resources.requests.memory);
            }
            nsCosts.set(ns, entry);
          }
        }
      } catch { /* ignore */ }

      const totalClusterCostPerHour = totalCpu * CPU_COST_PER_CORE_HOUR + totalMem * MEMORY_COST_PER_GI_HOUR;
      const totalMonthlyCost = totalClusterCostPerHour * 730;

      const namespaces: NamespaceCost[] = Array.from(nsCosts.entries())
        .map(([ns, entry]) => {
          const cpuCost = entry.cpu * CPU_COST_PER_CORE_HOUR;
          const memCost = entry.mem * MEMORY_COST_PER_GI_HOUR;
          const totalPerHour = cpuCost + memCost;
          const monthly = totalPerHour * 730;
          return {
            namespace: ns,
            podCount: entry.pods,
            cpuCores: entry.cpu,
            memoryGi: entry.mem,
            cpuCostPerHour: cpuCost,
            memoryCostPerHour: memCost,
            totalCostPerHour: totalPerHour,
            monthlyCost: monthly,
            percentOfTotal: totalMonthlyCost > 0 ? (monthly / totalMonthlyCost) * 100 : 0,
          };
        })
        .sort((a, b) => b.monthlyCost - a.monthlyCost);

      setSummary({ totalNodes, totalCpuCores: totalCpu, totalMemoryGi: totalMem, totalMonthlyCost, namespaces });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <PageSection><p className="os-text-muted">Calculating costs...</p></PageSection>;
  if (!summary) return <PageSection><p className="os-text-muted">No data available.</p></PageSection>;

  const top5 = summary.namespaces.slice(0, 5);

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">Cost Dashboard</Title>
        <p className="os-text-muted">Estimated compute cost attribution by namespace (based on CPU/memory requests)</p>
      </PageSection>

      <PageSection>
        <Grid hasGutter>
          {/* Summary cards */}
          <GridItem md={3}>
            <Card><CardBody>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--os-text-muted)' }}>Estimated Monthly</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>${summary.totalMonthlyCost.toFixed(0)}</div>
            </CardBody></Card>
          </GridItem>
          <GridItem md={3}>
            <Card><CardBody>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--os-text-muted)' }}>Nodes</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{summary.totalNodes}</div>
            </CardBody></Card>
          </GridItem>
          <GridItem md={3}>
            <Card><CardBody>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--os-text-muted)' }}>Total CPU</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{summary.totalCpuCores} cores</div>
            </CardBody></Card>
          </GridItem>
          <GridItem md={3}>
            <Card><CardBody>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--os-text-muted)' }}>Total Memory</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{summary.totalMemoryGi.toFixed(0)} Gi</div>
            </CardBody></Card>
          </GridItem>

          {/* Top 5 spenders */}
          <GridItem md={6}>
            <Card><CardBody>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Top Cost by Namespace</div>
              {top5.map((ns) => (
                <div key={ns.namespace} style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => navigate(`/administration/namespaces/${ns.namespace}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{ns.namespace}</span>
                    <span style={{ fontWeight: 600 }}>${ns.monthlyCost.toFixed(2)}/mo</span>
                  </div>
                  <Progress value={ns.percentOfTotal} title="" size="sm" variant={ns.percentOfTotal > 30 ? ProgressVariant.warning : undefined} />
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--os-text-muted)', marginTop: 2 }}>
                    <span>{ns.podCount} pods</span>
                    <span>{ns.cpuCores.toFixed(1)} CPU</span>
                    <span>{ns.memoryGi.toFixed(1)} Gi</span>
                    <span>{ns.percentOfTotal.toFixed(1)}% of total</span>
                  </div>
                </div>
              ))}
            </CardBody></Card>
          </GridItem>

          {/* Full breakdown table */}
          <GridItem md={6}>
            <Card><CardBody>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>All Namespaces ({summary.namespaces.length})</div>
              <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px', fontWeight: 600 }}>Namespace</th>
                      <th style={{ padding: '6px 8px' }}>Pods</th>
                      <th style={{ padding: '6px 8px' }}>CPU</th>
                      <th style={{ padding: '6px 8px' }}>Memory</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>$/month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.namespaces.map((ns, i) => (
                      <tr key={ns.namespace} style={{ borderBottom: '1px solid var(--glass-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)', cursor: 'pointer' }}
                        onClick={() => navigate(`/administration/namespaces/${ns.namespace}`)}>
                        <td style={{ padding: '5px 8px', fontWeight: 500 }}>{ns.namespace}</td>
                        <td style={{ padding: '5px 8px' }}>{ns.podCount}</td>
                        <td style={{ padding: '5px 8px' }}>{ns.cpuCores.toFixed(2)}</td>
                        <td style={{ padding: '5px 8px' }}>{ns.memoryGi.toFixed(1)} Gi</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>${ns.monthlyCost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody></Card>
          </GridItem>

          {/* Pricing note */}
          <GridItem md={12}>
            <div style={{ fontSize: 11, color: 'var(--os-text-muted)', textAlign: 'center', padding: 8 }}>
              Estimates based on ${CPU_COST_PER_CORE_HOUR}/core-hour and ${MEMORY_COST_PER_GI_HOUR}/Gi-hour. Actual costs depend on your cloud provider and instance types.
            </div>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
}
