import React, { useState, useEffect, useCallback } from 'react';
import { PageSection, Title, Card, CardBody, Grid, GridItem, Label, Button, Progress, ProgressVariant } from '@patternfly/react-core';
import { useUIStore } from '@/store/useUIStore';

const BASE = '/api/kubernetes';
const PROM = '/api/prometheus';

interface ClusterInfo {
  name: string;
  url: string;
  status: 'connected' | 'degraded' | 'error';
  version: string;
  platform: string;
  nodes: number;
  nodesReady: number;
  pods: number;
  podsRunning: number;
  cpuPercent: number;
  memPercent: number;
  firingAlerts: number;
  namespaces: number;
}

export default function MultiCluster() {
  const addToast = useUIStore((s) => s.addToast);
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentCluster() {
      const cluster: ClusterInfo = {
        name: 'Current Cluster',
        url: window.location.origin,
        status: 'connected',
        version: '-',
        platform: '-',
        nodes: 0,
        nodesReady: 0,
        pods: 0,
        podsRunning: 0,
        cpuPercent: 0,
        memPercent: 0,
        firingAlerts: 0,
        namespaces: 0,
      };

      // Version
      try {
        const res = await fetch(`${BASE}/apis/config.openshift.io/v1/clusterversions/version`);
        if (res.ok) {
          const data = await res.json() as { status?: { desired?: { version?: string } } };
          cluster.version = `OpenShift ${data.status?.desired?.version ?? '-'}`;
        }
      } catch { /* ignore */ }

      try {
        const res = await fetch(`${BASE}/apis/config.openshift.io/v1/infrastructures/cluster`);
        if (res.ok) {
          const data = await res.json() as { status?: { platform?: string; apiServerURL?: string } };
          cluster.platform = data.status?.platform ?? '-';
          cluster.url = data.status?.apiServerURL ?? cluster.url;
        }
      } catch { /* ignore */ }

      // Nodes
      try {
        const res = await fetch(`${BASE}/api/v1/nodes`);
        if (res.ok) {
          const data = await res.json() as { items: { status: { conditions: { type: string; status: string }[] } }[] };
          cluster.nodes = data.items.length;
          cluster.nodesReady = data.items.filter((n) => n.status.conditions.some((c) => c.type === 'Ready' && c.status === 'True')).length;
        }
      } catch { /* ignore */ }

      // Pods
      try {
        const res = await fetch(`${BASE}/api/v1/pods`);
        if (res.ok) {
          const data = await res.json() as { items: { status: { phase: string } }[] };
          cluster.pods = data.items.length;
          cluster.podsRunning = data.items.filter((p) => p.status.phase === 'Running').length;
        }
      } catch { /* ignore */ }

      // Namespaces
      try {
        const res = await fetch(`${BASE}/api/v1/namespaces`);
        if (res.ok) {
          const data = await res.json() as { items: unknown[] };
          cluster.namespaces = data.items.length;
        }
      } catch { /* ignore */ }

      // Metrics
      try {
        const res = await fetch(`${BASE}/apis/metrics.k8s.io/v1beta1/nodes`);
        if (res.ok) {
          const nodeRes = await fetch(`${BASE}/api/v1/nodes`);
          if (nodeRes.ok) {
            const metrics = await res.json() as { items: { usage: { cpu: string; memory: string } }[] };
            const nodes = await nodeRes.json() as { items: { status: { allocatable: { cpu: string; memory: string } } }[] };
            let usedCpu = 0, totalCpu = 0, usedMem = 0, totalMem = 0;
            for (const m of metrics.items) {
              const cpu = m.usage.cpu;
              usedCpu += cpu.endsWith('n') ? parseInt(cpu) / 1e9 : cpu.endsWith('m') ? parseInt(cpu) / 1000 : parseFloat(cpu);
            }
            for (const n of nodes.items) {
              const cpu = n.status.allocatable.cpu;
              totalCpu += cpu.endsWith('m') ? parseInt(cpu) / 1000 : parseFloat(cpu);
              const mem = n.status.allocatable.memory;
              totalMem += mem.endsWith('Ki') ? parseInt(mem) / (1024 * 1024) : mem.endsWith('Mi') ? parseInt(mem) / 1024 : mem.endsWith('Gi') ? parseFloat(mem) : 0;
            }
            for (const m of metrics.items) {
              const mem = m.usage.memory;
              usedMem += mem.endsWith('Ki') ? parseInt(mem) / (1024 * 1024) : mem.endsWith('Mi') ? parseInt(mem) / 1024 : mem.endsWith('Gi') ? parseFloat(mem) : 0;
            }
            cluster.cpuPercent = totalCpu > 0 ? Math.round((usedCpu / totalCpu) * 100) : 0;
            cluster.memPercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0;
          }
        }
      } catch { /* ignore */ }

      // Alerts
      try {
        const res = await fetch(`${PROM}/api/v1/alerts`);
        if (res.ok) {
          const data = await res.json() as { data?: { alerts?: { state: string }[] } };
          cluster.firingAlerts = data.data?.alerts?.filter((a) => a.state === 'firing').length ?? 0;
        }
      } catch { /* ignore */ }

      cluster.status = cluster.nodesReady < cluster.nodes ? 'degraded' : 'connected';

      setClusters([cluster]);
      setLoading(false);
    }
    loadCurrentCluster();
  }, []);

  const statusColor = { connected: 'green' as const, degraded: 'orange' as const, error: 'red' as const };
  const statusLabel = { connected: 'Healthy', degraded: 'Degraded', error: 'Unreachable' };

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">Multi-Cluster Overview</Title>
        <p className="os-text-muted">Fleet-wide view of all connected clusters. Add clusters via kubeconfig to manage multiple environments.</p>
      </PageSection>

      <PageSection>
        {loading ? (
          <Card><CardBody><p className="os-text-muted">Loading cluster data...</p></CardBody></Card>
        ) : (
          <Grid hasGutter>
            {clusters.map((cluster) => (
              <GridItem md={12} key={cluster.name}>
                <Card>
                  <CardBody>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor[cluster.status] === 'green' ? '#3e8635' : statusColor[cluster.status] === 'orange' ? '#f0ab00' : '#c9190b' }} />
                          <span style={{ fontSize: 18, fontWeight: 700 }}>{cluster.name}</span>
                          <Label color={statusColor[cluster.status]}>{statusLabel[cluster.status]}</Label>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--os-text-muted)', marginTop: 4 }}>
                          {cluster.version} &middot; {cluster.platform} &middot; <code>{cluster.url}</code>
                        </div>
                      </div>
                      {cluster.firingAlerts > 0 && (
                        <Label color="red">{cluster.firingAlerts} firing alert{cluster.firingAlerts !== 1 ? 's' : ''}</Label>
                      )}
                    </div>

                    <Grid hasGutter>
                      <GridItem md={2}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 800 }}>{cluster.nodesReady}/{cluster.nodes}</div>
                          <div style={{ fontSize: 11, color: 'var(--os-text-muted)' }}>Nodes Ready</div>
                        </div>
                      </GridItem>
                      <GridItem md={2}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 800 }}>{cluster.podsRunning}/{cluster.pods}</div>
                          <div style={{ fontSize: 11, color: 'var(--os-text-muted)' }}>Pods Running</div>
                        </div>
                      </GridItem>
                      <GridItem md={2}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 800 }}>{cluster.namespaces}</div>
                          <div style={{ fontSize: 11, color: 'var(--os-text-muted)' }}>Namespaces</div>
                        </div>
                      </GridItem>
                      <GridItem md={3}>
                        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>CPU {cluster.cpuPercent}%</div>
                        <Progress value={cluster.cpuPercent} title="" size="sm" variant={cluster.cpuPercent > 80 ? ProgressVariant.danger : cluster.cpuPercent > 60 ? ProgressVariant.warning : undefined} />
                      </GridItem>
                      <GridItem md={3}>
                        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Memory {cluster.memPercent}%</div>
                        <Progress value={cluster.memPercent} title="" size="sm" variant={cluster.memPercent > 80 ? ProgressVariant.danger : cluster.memPercent > 60 ? ProgressVariant.warning : undefined} />
                      </GridItem>
                    </Grid>
                  </CardBody>
                </Card>
              </GridItem>
            ))}

            {/* Add Cluster Card */}
            <GridItem md={12}>
              <Card>
                <CardBody style={{ textAlign: 'center', padding: 24 }}>
                  <div style={{ fontSize: 14, color: 'var(--os-text-muted)', marginBottom: 12 }}>
                    Connect additional clusters by configuring kubeconfig contexts and proxy endpoints.
                  </div>
                  <Button variant="secondary" onClick={() => addToast({ type: 'info', title: 'Multi-cluster setup', description: 'Configure additional cluster proxies in rspack.config.ts and add entries to the clusters array.' })}>
                    + Add Cluster
                  </Button>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        )}
      </PageSection>
    </>
  );
}
