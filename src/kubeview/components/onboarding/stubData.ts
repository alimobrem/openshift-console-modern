/**
 * Stub readiness data for development.
 * Produces a proper ReadinessReport using the engine types.
 */
import type { ReadinessReport, ReadinessCategory, GateResult, GateStatus, CategorySummary } from './types';

interface StubGateDef {
  id: string;
  title: string;
  description: string;
  category: ReadinessCategory;
  status: GateStatus;
  fixGuidance?: string;
}

const STUB_GATES: StubGateDef[] = [
  // Prerequisites
  { id: 'prereq-nodes', title: 'Minimum node count', description: 'At least 3 control-plane and 2 worker nodes', category: 'prerequisites', status: 'passed' },
  { id: 'prereq-version', title: 'Supported OCP version', description: 'Running a supported OpenShift release', category: 'prerequisites', status: 'passed' },
  { id: 'prereq-storage', title: 'Default StorageClass', description: 'A default StorageClass is configured', category: 'prerequisites', status: 'needs_attention', fixGuidance: 'Run: oc annotate storageclass <name> storageclass.kubernetes.io/is-default-class=true' },
  { id: 'prereq-dns', title: 'DNS resolution', description: 'Cluster DNS resolves internal names', category: 'prerequisites', status: 'passed' },
  // Security
  { id: 'sec-oauth', title: 'Identity provider configured', description: 'At least one non-HTPasswd IdP', category: 'security', status: 'failed', fixGuidance: 'Configure an external identity provider (LDAP, OIDC, etc.) via OAuth cluster config.' },
  { id: 'sec-kubeadmin', title: 'kubeadmin removed', description: 'The kubeadmin secret should be deleted', category: 'security', status: 'failed', fixGuidance: 'oc delete secret kubeadmin -n kube-system' },
  { id: 'sec-tls', title: 'API/Ingress TLS', description: 'Custom TLS certificates for API and default ingress', category: 'security', status: 'needs_attention', fixGuidance: 'Replace self-signed certs with certificates from a trusted CA.' },
  { id: 'sec-netpol', title: 'Network policies', description: 'Default deny + allow rules in user namespaces', category: 'security', status: 'not_started' },
  { id: 'sec-scc', title: 'SCC usage audit', description: 'No workloads using privileged SCC unnecessarily', category: 'security', status: 'passed' },
  // Reliability
  { id: 'rel-ha', title: 'HA control plane', description: 'Multiple control-plane replicas', category: 'reliability', status: 'passed' },
  { id: 'rel-pdb', title: 'PodDisruptionBudgets', description: 'Critical workloads have PDBs', category: 'reliability', status: 'needs_attention', fixGuidance: 'Create PDBs for workloads in production namespaces.' },
  { id: 'rel-limits', title: 'Resource requests/limits', description: 'All pods have CPU/memory requests', category: 'reliability', status: 'failed', fixGuidance: 'Add resource requests and limits to all Deployments in production namespaces.' },
  { id: 'rel-hpa', title: 'Horizontal autoscaling', description: 'HPAs configured for variable workloads', category: 'reliability', status: 'not_started' },
  // Observability
  { id: 'obs-monitoring', title: 'Cluster monitoring', description: 'Prometheus stack is healthy', category: 'observability', status: 'passed' },
  { id: 'obs-alerting', title: 'Alert receivers', description: 'AlertManager has configured receivers', category: 'observability', status: 'needs_attention', fixGuidance: 'Configure at least one notification receiver in AlertManager.' },
  { id: 'obs-logging', title: 'Cluster logging', description: 'Log forwarding is configured', category: 'observability', status: 'not_started' },
  { id: 'obs-metrics', title: 'User workload monitoring', description: 'User workload monitoring is enabled', category: 'observability', status: 'passed' },
  // Operations
  { id: 'ops-backup', title: 'etcd backup', description: 'Automated etcd backup schedule exists', category: 'operations', status: 'failed', fixGuidance: 'Configure CronJob-based etcd backups or use an etcd backup operator.' },
  { id: 'ops-channel', title: 'Update channel', description: 'Cluster is on a stable update channel', category: 'operations', status: 'passed' },
  { id: 'ops-drain', title: 'Node drain strategy', description: 'MachineConfig drain strategy is set', category: 'operations', status: 'not_started' },
  { id: 'ops-quotas', title: 'Resource quotas', description: 'Quotas in user namespaces', category: 'operations', status: 'needs_attention', fixGuidance: 'Create ResourceQuotas for all user-facing namespaces.' },
  // GitOps
  { id: 'gitops-operator', title: 'GitOps operator', description: 'OpenShift GitOps / ArgoCD is installed', category: 'gitops', status: 'not_started' },
  { id: 'gitops-repo', title: 'Git repository', description: 'At least one Application is syncing', category: 'gitops', status: 'not_started' },
  { id: 'gitops-sync', title: 'Sync health', description: 'All Applications are synced and healthy', category: 'gitops', status: 'not_started' },
];

function buildCategorySummary(gates: StubGateDef[]): CategorySummary {
  let passed = 0;
  let failed = 0;
  let needs_attention = 0;
  let not_started = 0;
  for (const g of gates) {
    switch (g.status) {
      case 'passed': passed++; break;
      case 'failed': failed++; break;
      case 'needs_attention': needs_attention++; break;
      default: not_started++; break;
    }
  }
  const total = gates.length;
  const score = total > 0 ? Math.round((passed / total) * 100) : 0;
  return { passed, failed, needs_attention, not_started, total, score };
}

export function buildStubReport(): ReadinessReport {
  const now = Date.now();

  // Build results map
  const results: Record<string, GateResult> = {};
  for (const g of STUB_GATES) {
    results[g.id] = {
      gateId: g.id,
      status: g.status,
      detail: `Evaluated at ${new Date(now).toISOString()}`,
      fixGuidance: g.fixGuidance ?? '',
      evaluatedAt: now,
    };
  }

  // Build category summaries
  const allCategories: ReadinessCategory[] = [
    'prerequisites', 'security', 'reliability', 'observability', 'operations', 'gitops',
  ];
  const categories = {} as Record<ReadinessCategory, CategorySummary>;
  for (const catId of allCategories) {
    const catGates = STUB_GATES.filter((g) => g.category === catId);
    categories[catId] = buildCategorySummary(catGates);
  }

  // Compute overall score
  let totalGates = 0;
  let passedGates = 0;
  for (const s of Object.values(categories)) {
    totalGates += s.total;
    passedGates += s.passed;
  }
  const score = totalGates > 0 ? Math.round((passedGates / totalGates) * 100) : 0;

  return {
    score,
    productionReady: score >= 80,
    results,
    waivers: {},
    categories,
    generatedAt: now,
  };
}
