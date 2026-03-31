/**
 * Intent Mocks — realistic sample intents for empty-state and demos.
 */

import type { Intent } from '../../store/intentStore';
import type { SimulationResult } from '../types/mvpTypes';

const AGENTS = {
  sre: { id: 'sre', name: 'SRE Agent', icon: 'Shield', color: 'text-blue-400' },
  security: { id: 'security', name: 'Security Agent', icon: 'Lock', color: 'text-emerald-400' },
  capacity: { id: 'capacity', name: 'Capacity Agent', icon: 'BarChart3', color: 'text-amber-400' },
  network: { id: 'network', name: 'Network Agent', icon: 'Globe', color: 'text-cyan-400' },
};

const simScale: SimulationResult = {
  costDelta: { current: 100, projected: 142, changePercent: 42 },
  securityPosture: { current: 78, projected: 78, details: ['No security impact'] },
  resourceImpact: {
    added: ['HorizontalPodAutoscaler/api-gateway'],
    removed: [],
    modified: ['Deployment/api-gateway', 'Deployment/order-service'],
  },
  latencyEstimate: { p50Ms: 8, p99Ms: 55 },
  riskScore: 'low',
  confidence: 0.95,
  executionTimeMinutes: 3,
};

const simTLS: SimulationResult = {
  costDelta: { current: 100, projected: 103, changePercent: 3 },
  securityPosture: { current: 64, projected: 89, details: ['TLS 1.3 enforced on 12 routes', 'Certificate auto-renewal via cert-manager', 'HSTS headers added'] },
  resourceImpact: {
    added: ['Certificate/wildcard-prod', 'Issuer/letsencrypt-prod'],
    removed: [],
    modified: ['Route/api', 'Route/web', 'Route/admin', 'Route/grafana'],
  },
  latencyEstimate: { p50Ms: 2, p99Ms: 15 },
  riskScore: 'medium',
  confidence: 0.88,
  executionTimeMinutes: 12,
};

const simNetPolicy: SimulationResult = {
  costDelta: { current: 100, projected: 100, changePercent: 0 },
  securityPosture: { current: 55, projected: 82, details: ['Default-deny ingress applied', 'Namespace isolation enforced', '14 allow rules for observed traffic'] },
  resourceImpact: {
    added: ['NetworkPolicy/default-deny', 'NetworkPolicy/allow-monitoring', 'NetworkPolicy/allow-ingress'],
    removed: [],
    modified: [],
  },
  latencyEstimate: { p50Ms: 0, p99Ms: 2 },
  riskScore: 'medium',
  confidence: 0.82,
  executionTimeMinutes: 5,
};

const simOptimize: SimulationResult = {
  costDelta: { current: 100, projected: 71, changePercent: -29 },
  securityPosture: { current: 78, projected: 78, details: ['No security impact'] },
  resourceImpact: {
    added: ['VPA/api-gateway', 'VPA/worker'],
    removed: ['Deployment/legacy-cron'],
    modified: ['Deployment/api-gateway', 'Deployment/worker', 'Deployment/cache'],
  },
  latencyEstimate: { p50Ms: 14, p99Ms: 120 },
  riskScore: 'low',
  confidence: 0.91,
  executionTimeMinutes: 8,
};

const simDR: SimulationResult = {
  costDelta: { current: 100, projected: 160, changePercent: 60 },
  securityPosture: { current: 78, projected: 85, details: ['Cross-region replication encrypted', 'Backup integrity checks added'] },
  resourceImpact: {
    added: ['VolumeSnapshotSchedule/daily', 'CronJob/backup-verify', 'PodDisruptionBudget/api-gateway'],
    removed: [],
    modified: ['StatefulSet/postgres', 'Deployment/api-gateway'],
  },
  latencyEstimate: { p50Ms: 45, p99Ms: 300 },
  riskScore: 'high',
  confidence: 0.79,
  executionTimeMinutes: 25,
};

const now = Date.now();

export const SAMPLE_INTENTS: Intent[] = [
  {
    id: 'sample-1',
    input: 'Scale the API gateway to handle 3x current traffic with zero downtime',
    status: 'completed',
    plan: [
      { id: 's1-1', label: 'Analyze current load', description: 'Check CPU/memory across api-gateway pods', agent: AGENTS.sre, status: 'done', durationMs: 1200 },
      { id: 's1-2', label: 'Calculate target replicas', description: 'Determine optimal pod count for 3x load', agent: AGENTS.capacity, status: 'done', durationMs: 800 },
      { id: 's1-3', label: 'Configure HPA', description: 'Set HPA min=6, max=18 with CPU target 65%', agent: AGENTS.sre, status: 'done', durationMs: 600 },
      { id: 's1-4', label: 'Validate rolling update', description: 'Confirm zero-downtime deployment strategy', agent: AGENTS.sre, status: 'done', durationMs: 400 },
    ],
    simulation: simScale,
    createdAt: now - 86400000,
    updatedAt: now - 86400000 + 5000,
  },
  {
    id: 'sample-2',
    input: 'Enforce TLS 1.3 on all external routes and set up certificate auto-renewal',
    status: 'pending_review',
    plan: [
      { id: 's2-1', label: 'Audit TLS configuration', description: 'Scan 12 routes for TLS termination settings', agent: AGENTS.security, status: 'pending' },
      { id: 's2-2', label: 'Deploy cert-manager issuer', description: 'Configure LetsEncrypt ClusterIssuer for prod', agent: AGENTS.security, status: 'pending' },
      { id: 's2-3', label: 'Generate certificates', description: 'Request wildcard cert for *.apps.cluster.example.com', agent: AGENTS.security, status: 'pending' },
      { id: 's2-4', label: 'Update route TLS', description: 'Patch all routes to edge termination with TLS 1.3', agent: AGENTS.network, status: 'pending' },
    ],
    simulation: simTLS,
    createdAt: now - 3600000,
    updatedAt: now - 3600000 + 2000,
  },
  {
    id: 'sample-3',
    input: 'Implement network isolation between production namespaces',
    status: 'pending_review',
    plan: [
      { id: 's3-1', label: 'Map network flows', description: 'Discover pod-to-pod communication across 8 namespaces', agent: AGENTS.network, status: 'pending' },
      { id: 's3-2', label: 'Generate policies', description: 'Create deny-all base with 14 allow rules', agent: AGENTS.security, status: 'pending' },
      { id: 's3-3', label: 'Dry-run validation', description: 'Simulate enforcement against live traffic', agent: AGENTS.network, status: 'pending' },
      { id: 's3-4', label: 'Apply policies', description: 'Deploy NetworkPolicy resources', agent: AGENTS.network, status: 'pending' },
    ],
    simulation: simNetPolicy,
    createdAt: now - 7200000,
    updatedAt: now - 7200000 + 2000,
  },
  {
    id: 'sample-4',
    input: 'Optimize resource requests to reduce costs by 25% without impacting performance',
    status: 'completed',
    plan: [
      { id: 's4-1', label: 'Collect usage metrics', description: 'Analyze 7-day CPU/memory usage patterns', agent: AGENTS.capacity, status: 'done', durationMs: 2000 },
      { id: 's4-2', label: 'Identify over-provisioned workloads', description: 'Found 3 deployments using <30% of requests', agent: AGENTS.capacity, status: 'done', durationMs: 1000 },
      { id: 's4-3', label: 'Right-size resources', description: 'Adjust requests/limits based on p95 usage + 20% buffer', agent: AGENTS.sre, status: 'done', durationMs: 800 },
      { id: 's4-4', label: 'Deploy VPA recommendations', description: 'Install VPA for continuous right-sizing', agent: AGENTS.sre, status: 'done', durationMs: 600 },
    ],
    simulation: simOptimize,
    createdAt: now - 172800000,
    updatedAt: now - 172800000 + 8000,
  },
  {
    id: 'sample-5',
    input: 'Set up disaster recovery with daily backups and cross-region failover',
    status: 'pending_review',
    plan: [
      { id: 's5-1', label: 'Inventory stateful workloads', description: 'Identify all PVCs and StatefulSets requiring backup', agent: AGENTS.sre, status: 'pending' },
      { id: 's5-2', label: 'Configure volume snapshots', description: 'Set up daily VolumeSnapshot schedule with 7-day retention', agent: AGENTS.sre, status: 'pending' },
      { id: 's5-3', label: 'Set up replication', description: 'Enable cross-region PV replication for critical data', agent: AGENTS.sre, status: 'pending' },
      { id: 's5-4', label: 'Add PodDisruptionBudgets', description: 'Ensure availability during failover scenarios', agent: AGENTS.sre, status: 'pending' },
      { id: 's5-5', label: 'Create verification job', description: 'Deploy CronJob to verify backup integrity nightly', agent: AGENTS.security, status: 'pending' },
    ],
    simulation: simDR,
    createdAt: now - 1800000,
    updatedAt: now - 1800000 + 2000,
  },
];

export const EXAMPLE_PROMPTS = [
  'Scale the API gateway to handle 3x traffic',
  'Enforce TLS on all external routes',
  'Implement network isolation between namespaces',
  'Optimize resource requests to reduce costs by 25%',
  'Set up disaster recovery with daily backups',
];
