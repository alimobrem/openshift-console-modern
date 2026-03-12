import React, { useState, useCallback } from 'react';
import { PageSection, Title, Card, CardBody, Grid, GridItem, Button, Label, Modal, ModalVariant, ModalHeader, ModalBody, ModalFooter } from '@patternfly/react-core';
import { useUIStore } from '@/store/useUIStore';

const BASE = '/api/kubernetes';

interface RunbookStep {
  description: string;
  check: () => Promise<{ passed: boolean; detail: string }>;
  fix?: () => Promise<string>;
}

interface Runbook {
  id: string;
  name: string;
  description: string;
  trigger: string;
  icon: string;
  steps: RunbookStep[];
}

interface StepResult {
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'fixed';
  detail: string;
}

// --- Built-in Runbooks ---

const runbooks: Runbook[] = [
  {
    id: 'crashloop',
    name: 'CrashLoopBackOff Recovery',
    description: 'Diagnose and fix pods stuck in CrashLoopBackOff',
    trigger: 'Pod CrashLoopBackOff',
    icon: '🔄',
    steps: [
      {
        description: 'Find pods in CrashLoopBackOff',
        check: async () => {
          const res = await fetch(`${BASE}/api/v1/pods`);
          if (!res.ok) return { passed: false, detail: 'Failed to fetch pods' };
          const data = await res.json() as { items: { metadata: { name: string; namespace: string }; status: { containerStatuses?: { state?: { waiting?: { reason?: string } }; restartCount: number }[] } }[] };
          const crashing = data.items.filter((p) =>
            p.status.containerStatuses?.some((cs) => cs.state?.waiting?.reason === 'CrashLoopBackOff' || cs.restartCount > 10)
          );
          if (crashing.length === 0) return { passed: true, detail: 'No CrashLoopBackOff pods found' };
          return { passed: false, detail: `${crashing.length} pods: ${crashing.slice(0, 3).map((p) => `${p.metadata.namespace}/${p.metadata.name}`).join(', ')}` };
        },
      },
      {
        description: 'Check for OOMKilled containers',
        check: async () => {
          const res = await fetch(`${BASE}/api/v1/events?fieldSelector=reason=OOMKilling&limit=10`);
          if (!res.ok) return { passed: true, detail: 'Could not check events' };
          const data = await res.json() as { items: unknown[] };
          if (data.items.length === 0) return { passed: true, detail: 'No OOMKilled events' };
          return { passed: false, detail: `${data.items.length} OOMKill events in cluster` };
        },
      },
      {
        description: 'Check for ImagePullBackOff',
        check: async () => {
          const res = await fetch(`${BASE}/api/v1/events?fieldSelector=reason=Failed&limit=20`);
          if (!res.ok) return { passed: true, detail: 'Could not check events' };
          const data = await res.json() as { items: { message: string }[] };
          const imagePull = data.items.filter((e) => e.message.includes('ImagePullBackOff') || e.message.includes('ErrImagePull'));
          if (imagePull.length === 0) return { passed: true, detail: 'No image pull errors' };
          return { passed: false, detail: `${imagePull.length} image pull failures` };
        },
      },
      {
        description: 'Check resource limits on failing pods',
        check: async () => {
          const res = await fetch(`${BASE}/api/v1/pods`);
          if (!res.ok) return { passed: true, detail: 'Could not fetch pods' };
          const data = await res.json() as { items: { status: { containerStatuses?: { restartCount: number }[] }; spec: { containers: { resources?: { limits?: Record<string, string> } }[] } }[] };
          const noLimits = data.items.filter((p) =>
            (p.status.containerStatuses?.some((cs) => cs.restartCount > 5)) &&
            p.spec.containers.some((c) => !c.resources?.limits)
          );
          if (noLimits.length === 0) return { passed: true, detail: 'All failing pods have resource limits' };
          return { passed: false, detail: `${noLimits.length} crashing pods without resource limits — consider adding memory/CPU limits` };
        },
      },
    ],
  },
  {
    id: 'node-pressure',
    name: 'Node Pressure Response',
    description: 'Check and resolve node resource pressure conditions',
    trigger: 'Node MemoryPressure / DiskPressure',
    icon: '🖥️',
    steps: [
      {
        description: 'Check node conditions for pressure',
        check: async () => {
          const res = await fetch(`${BASE}/api/v1/nodes`);
          if (!res.ok) return { passed: false, detail: 'Failed to fetch nodes' };
          const data = await res.json() as { items: { metadata: { name: string }; status: { conditions: { type: string; status: string }[] } }[] };
          const pressured = data.items.filter((n) =>
            n.status.conditions.some((c) => (c.type === 'MemoryPressure' || c.type === 'DiskPressure' || c.type === 'PIDPressure') && c.status === 'True')
          );
          if (pressured.length === 0) return { passed: true, detail: 'No nodes under pressure' };
          return { passed: false, detail: `${pressured.length} nodes under pressure: ${pressured.map((n) => n.metadata.name).join(', ')}` };
        },
      },
      {
        description: 'Identify top resource consumers on pressured nodes',
        check: async () => {
          const res = await fetch(`${BASE}/api/v1/pods`);
          if (!res.ok) return { passed: true, detail: 'Could not fetch pods' };
          const data = await res.json() as { items: { spec: { containers: { resources?: { requests?: { memory?: string } } }[] } }[] };
          const highMem = data.items.filter((p) =>
            p.spec.containers.some((c) => {
              const mem = c.resources?.requests?.memory;
              if (!mem) return false;
              const gi = mem.endsWith('Gi') ? parseFloat(mem) : mem.endsWith('Mi') ? parseFloat(mem) / 1024 : 0;
              return gi > 2;
            })
          );
          if (highMem.length === 0) return { passed: true, detail: 'No pods requesting >2Gi memory' };
          return { passed: false, detail: `${highMem.length} pods requesting >2Gi memory — consider reducing requests or scaling nodes` };
        },
      },
      {
        description: 'Check if cluster autoscaler is configured',
        check: async () => {
          try {
            const res = await fetch(`${BASE}/apis/autoscaling.openshift.io/v1/namespaces/openshift-machine-api/clusterautoscalers`);
            if (!res.ok) return { passed: false, detail: 'ClusterAutoscaler not found — cluster cannot auto-scale' };
            const data = await res.json() as { items: unknown[] };
            if (data.items.length === 0) return { passed: false, detail: 'No ClusterAutoscaler configured' };
            return { passed: true, detail: 'ClusterAutoscaler is configured' };
          } catch {
            return { passed: true, detail: 'Could not check autoscaler (API may not exist)' };
          }
        },
      },
    ],
  },
  {
    id: 'cert-expiry',
    name: 'Certificate Expiry Check',
    description: 'Find and renew expiring TLS certificates',
    trigger: 'Certificate near expiry',
    icon: '🔐',
    steps: [
      {
        description: 'Find TLS secrets older than 300 days',
        check: async () => {
          const res = await fetch(`${BASE}/api/v1/secrets`);
          if (!res.ok) return { passed: false, detail: 'Failed to fetch secrets' };
          const data = await res.json() as { items: { metadata: { name: string; namespace: string; creationTimestamp: string }; type: string }[] };
          const tls = data.items.filter((s) => s.type === 'kubernetes.io/tls');
          const old = tls.filter((s) => {
            const age = (Date.now() - new Date(s.metadata.creationTimestamp).getTime()) / 86400000;
            return age > 300;
          });
          if (old.length === 0) return { passed: true, detail: `${tls.length} TLS secrets found, none older than 300 days` };
          return { passed: false, detail: `${old.length} TLS secrets older than 300 days: ${old.slice(0, 3).map((s) => `${s.metadata.namespace}/${s.metadata.name}`).join(', ')}` };
        },
      },
      {
        description: 'Check cluster operator certificate health',
        check: async () => {
          try {
            const res = await fetch(`${BASE}/apis/config.openshift.io/v1/clusteroperators`);
            if (!res.ok) return { passed: true, detail: 'Could not check operators' };
            const data = await res.json() as { items: { metadata: { name: string }; status: { conditions: { type: string; status: string }[] } }[] };
            const degraded = data.items.filter((op) =>
              op.status.conditions.some((c) => c.type === 'Degraded' && c.status === 'True')
            );
            if (degraded.length === 0) return { passed: true, detail: 'All operators healthy' };
            return { passed: false, detail: `${degraded.length} degraded operators: ${degraded.map((o) => o.metadata.name).join(', ')}` };
          } catch {
            return { passed: true, detail: 'Could not check operators' };
          }
        },
      },
    ],
  },
  {
    id: 'deployment-health',
    name: 'Deployment Health Audit',
    description: 'Check all deployments for best practices',
    trigger: 'Scheduled audit',
    icon: '📦',
    steps: [
      {
        description: 'Find deployments with single replica',
        check: async () => {
          const res = await fetch(`${BASE}/apis/apps/v1/deployments`);
          if (!res.ok) return { passed: false, detail: 'Failed to fetch deployments' };
          const data = await res.json() as { items: { metadata: { name: string; namespace: string }; spec: { replicas: number } }[] };
          const single = data.items.filter((d) => d.spec.replicas === 1 && !d.metadata.namespace.startsWith('openshift-') && !d.metadata.namespace.startsWith('kube-'));
          if (single.length === 0) return { passed: true, detail: 'All user deployments have >1 replica' };
          return { passed: false, detail: `${single.length} deployments with only 1 replica: ${single.slice(0, 5).map((d) => `${d.metadata.namespace}/${d.metadata.name}`).join(', ')}` };
        },
      },
      {
        description: 'Find deployments with unavailable replicas',
        check: async () => {
          const res = await fetch(`${BASE}/apis/apps/v1/deployments`);
          if (!res.ok) return { passed: false, detail: 'Failed to fetch deployments' };
          const data = await res.json() as { items: { metadata: { name: string; namespace: string }; spec: { replicas: number }; status: { readyReplicas?: number } }[] };
          const degraded = data.items.filter((d) => (d.status.readyReplicas ?? 0) < d.spec.replicas && d.spec.replicas > 0);
          if (degraded.length === 0) return { passed: true, detail: 'All deployments fully available' };
          return { passed: false, detail: `${degraded.length} degraded: ${degraded.slice(0, 5).map((d) => `${d.metadata.namespace}/${d.metadata.name} (${d.status.readyReplicas ?? 0}/${d.spec.replicas})`).join(', ')}` };
        },
      },
    ],
  },
];

// --- Component ---

export default function Runbooks() {
  const addToast = useUIStore((s) => s.addToast);
  const [activeRunbook, setActiveRunbook] = useState<Runbook | null>(null);
  const [results, setResults] = useState<StepResult[]>([]);
  const [running, setRunning] = useState(false);

  const runRunbook = useCallback(async (rb: Runbook) => {
    setActiveRunbook(rb);
    setRunning(true);
    const stepResults: StepResult[] = rb.steps.map((s) => ({ description: s.description, status: 'pending' as const, detail: '' }));
    setResults([...stepResults]);

    for (let i = 0; i < rb.steps.length; i++) {
      stepResults[i].status = 'running';
      setResults([...stepResults]);

      try {
        const result = await rb.steps[i].check();
        stepResults[i].status = result.passed ? 'passed' : 'failed';
        stepResults[i].detail = result.detail;
      } catch (err) {
        stepResults[i].status = 'failed';
        stepResults[i].detail = `Error: ${err instanceof Error ? err.message : String(err)}`;
      }
      setResults([...stepResults]);
    }

    setRunning(false);
    const failed = stepResults.filter((s) => s.status === 'failed').length;
    addToast({
      type: failed > 0 ? 'warning' : 'success',
      title: `${rb.name} complete`,
      description: failed > 0 ? `${failed} issue${failed !== 1 ? 's' : ''} found` : 'All checks passed',
    });
  }, [addToast]);

  const statusIcon: Record<string, string> = { pending: '○', running: '⟳', passed: '✅', failed: '❌', fixed: '🔧' };
  const statusColor: Record<string, string> = { pending: '#8a8d90', running: '#0066cc', passed: '#3e8635', failed: '#c9190b', fixed: '#009596' };

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">Runbook Automation</Title>
        <p className="os-text-muted">Automated diagnostic playbooks — codify troubleshooting steps and run them on demand</p>
      </PageSection>

      <PageSection>
        <Grid hasGutter>
          {runbooks.map((rb) => (
            <GridItem md={6} key={rb.id}>
              <Card>
                <CardBody>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>{rb.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{rb.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--os-text-muted)', marginTop: 2 }}>{rb.description}</div>
                      <div style={{ marginTop: 6 }}>
                        <Label color="blue" style={{ fontSize: 10 }}>Trigger: {rb.trigger}</Label>
                        <span style={{ fontSize: 11, color: 'var(--os-text-muted)', marginLeft: 8 }}>{rb.steps.length} checks</span>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => runRunbook(rb)} isLoading={running && activeRunbook?.id === rb.id}>
                      Run
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </GridItem>
          ))}
        </Grid>

        {/* Results modal */}
        <Modal variant={ModalVariant.medium} isOpen={!!activeRunbook && results.length > 0} onClose={() => { setActiveRunbook(null); setResults([]); }} aria-label="Runbook Results">
          <ModalHeader title={activeRunbook ? `${activeRunbook.icon} ${activeRunbook.name}` : ''} />
          <ModalBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: 16, minWidth: 24, textAlign: 'center', color: statusColor[step.status] }}>{statusIcon[step.status]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{step.description}</div>
                    {step.detail && <div style={{ fontSize: 12, color: step.status === 'failed' ? '#c9190b' : 'var(--os-text-muted)', marginTop: 2 }}>{step.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={() => { setActiveRunbook(null); setResults([]); }}>Done</Button>
          </ModalFooter>
        </Modal>
      </PageSection>
    </>
  );
}
