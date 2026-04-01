/**
 * Mock K8s API responses for E2E tests.
 * These provide realistic data shapes without needing a live cluster.
 */

export const NODES = {
  kind: 'NodeList',
  apiVersion: 'v1',
  items: [
    {
      apiVersion: 'v1', kind: 'Node',
      metadata: { name: 'worker-1', uid: 'n1', creationTimestamp: '2026-01-01T00:00:00Z', labels: { 'node-role.kubernetes.io/worker': '' } },
      status: { conditions: [{ type: 'Ready', status: 'True' }], allocatable: { cpu: '4', memory: '16Gi' } },
    },
    {
      apiVersion: 'v1', kind: 'Node',
      metadata: { name: 'worker-2', uid: 'n2', creationTimestamp: '2026-01-01T00:00:00Z', labels: { 'node-role.kubernetes.io/worker': '' } },
      status: { conditions: [{ type: 'Ready', status: 'True' }], allocatable: { cpu: '4', memory: '16Gi' } },
    },
    {
      apiVersion: 'v1', kind: 'Node',
      metadata: { name: 'master-1', uid: 'n3', creationTimestamp: '2026-01-01T00:00:00Z', labels: { 'node-role.kubernetes.io/master': '' } },
      status: { conditions: [{ type: 'Ready', status: 'True' }], allocatable: { cpu: '8', memory: '32Gi' } },
    },
  ],
};

export const PODS = {
  kind: 'PodList',
  apiVersion: 'v1',
  items: [
    {
      apiVersion: 'v1', kind: 'Pod',
      metadata: { name: 'nginx-7f8b9c-abc12', namespace: 'default', uid: 'p1', creationTimestamp: '2026-03-01T10:00:00Z', labels: { app: 'nginx' } },
      spec: { containers: [{ name: 'nginx', image: 'nginx:1.25' }] },
      status: { phase: 'Running', containerStatuses: [{ name: 'nginx', ready: true, restartCount: 0, state: { running: {} } }] },
    },
    {
      apiVersion: 'v1', kind: 'Pod',
      metadata: { name: 'api-server-5d7f8-xyz99', namespace: 'backend', uid: 'p2', creationTimestamp: '2026-03-01T10:00:00Z', labels: { app: 'api-server' } },
      spec: { containers: [{ name: 'api', image: 'api:latest' }] },
      status: { phase: 'Running', containerStatuses: [{ name: 'api', ready: true, restartCount: 0, state: { running: {} } }] },
    },
  ],
};

export const DEPLOYMENTS = {
  kind: 'DeploymentList',
  apiVersion: 'apps/v1',
  items: [
    {
      apiVersion: 'apps/v1', kind: 'Deployment',
      metadata: { name: 'nginx', namespace: 'default', uid: 'd1', creationTimestamp: '2026-01-15T00:00:00Z', labels: { app: 'nginx' } },
      spec: { replicas: 2, selector: { matchLabels: { app: 'nginx' } } },
      status: { replicas: 2, readyReplicas: 2, availableReplicas: 2, conditions: [{ type: 'Available', status: 'True' }] },
    },
    {
      apiVersion: 'apps/v1', kind: 'Deployment',
      metadata: { name: 'api-server', namespace: 'backend', uid: 'd2', creationTimestamp: '2026-02-01T00:00:00Z', labels: { app: 'api-server' } },
      spec: { replicas: 3, selector: { matchLabels: { app: 'api-server' } } },
      status: { replicas: 3, readyReplicas: 3, availableReplicas: 3, conditions: [{ type: 'Available', status: 'True' }] },
    },
  ],
};

export const NAMESPACES = {
  kind: 'NamespaceList',
  apiVersion: 'v1',
  items: [
    { apiVersion: 'v1', kind: 'Namespace', metadata: { name: 'default', uid: 'ns1' }, status: { phase: 'Active' } },
    { apiVersion: 'v1', kind: 'Namespace', metadata: { name: 'backend', uid: 'ns2' }, status: { phase: 'Active' } },
    { apiVersion: 'v1', kind: 'Namespace', metadata: { name: 'kube-system', uid: 'ns3' }, status: { phase: 'Active' } },
  ],
};

export const EVENTS = {
  kind: 'EventList',
  apiVersion: 'v1',
  items: [],
};

export const CLUSTER_VERSION = {
  apiVersion: 'config.openshift.io/v1',
  kind: 'ClusterVersion',
  metadata: { name: 'version' },
  spec: { channel: 'stable-4.16' },
  status: {
    desired: { version: '4.16.5' },
    history: [{ state: 'Completed', version: '4.16.5' }],
    conditions: [{ type: 'Available', status: 'True' }],
  },
};

export const INFRASTRUCTURE = {
  apiVersion: 'config.openshift.io/v1',
  kind: 'Infrastructure',
  metadata: { name: 'cluster' },
  status: {
    controlPlaneTopology: 'HighlyAvailable',
    platform: 'AWS',
    infrastructureName: 'pulse-test',
  },
};

/** Map of API paths to responses for the mock server */
export const API_RESPONSES: Record<string, unknown> = {
  '/api/v1/nodes': NODES,
  '/api/v1/pods': PODS,
  '/api/v1/namespaces': NAMESPACES,
  '/api/v1/events': EVENTS,
  '/apis/apps/v1/deployments': DEPLOYMENTS,
  '/apis/config.openshift.io/v1/clusterversions/version': CLUSTER_VERSION,
  '/apis/config.openshift.io/v1/infrastructures/cluster': INFRASTRUCTURE,
};
