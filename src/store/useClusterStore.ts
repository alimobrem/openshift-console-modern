import { create } from 'zustand';

interface Node {
  name: string;
  status: 'Ready' | 'NotReady';
  cpu: number;
  memory: number;
  role: string;
  version: string;
}

interface Pod {
  name: string;
  namespace: string;
  status: 'Running' | 'Pending' | 'Failed';
  restarts: number;
}

interface Deployment {
  name: string;
  namespace: string;
  replicas: number;
  ready: number;
  status: 'Available' | 'Progressing' | 'Failed';
}

interface Service {
  name: string;
  namespace: string;
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  clusterIP: string;
}

interface PersistentVolume {
  name: string;
  capacity: string;
  status: 'Bound' | 'Available' | 'Released';
  storageClass: string;
}

interface Namespace {
  name: string;
  status: 'Active' | 'Terminating';
  podCount: number;
  age: string;
}

interface Event {
  type: 'Warning' | 'Error' | 'Normal';
  reason: string;
  message: string;
  timestamp: string;
  namespace: string;
}

interface ClusterInfo {
  version: string;
  kubernetesVersion: string;
  platform: string;
  region: string;
  consoleURL: string;
  apiURL: string;
  updateChannel: string;
}

interface ResourceMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  pods: number;
}

interface StorageInfo {
  totalCapacity: string;
  used: string;
  available: string;
  storageClasses: number;
}

interface ClusterStore {
  nodes: Node[];
  pods: Pod[];
  deployments: Deployment[];
  services: Service[];
  persistentVolumes: PersistentVolume[];
  namespaces: Namespace[];
  events: Event[];
  clusterInfo: ClusterInfo | null;
  metrics: ResourceMetrics[];
  storageInfo: StorageInfo | null;
  selectedNamespace: string;
  setSelectedNamespace: (namespace: string) => void;
  fetchClusterData: () => Promise<void>;
}

export const useClusterStore = create<ClusterStore>((set) => ({
  nodes: [],
  pods: [],
  deployments: [],
  services: [],
  persistentVolumes: [],
  namespaces: [],
  events: [],
  clusterInfo: null,
  metrics: [],
  storageInfo: null,
  selectedNamespace: 'all',

  setSelectedNamespace: (namespace) => set({ selectedNamespace: namespace }),

  fetchClusterData: async () => {
    // Mock data for demonstration
    // In a real app, this would fetch from Kubernetes API via /api/kubernetes proxy
    const now = new Date();

    set({
      nodes: [
        { name: 'master-0', status: 'Ready', cpu: 45, memory: 62, role: 'control-plane,master', version: 'v1.28.3' },
        { name: 'worker-0', status: 'Ready', cpu: 78, memory: 85, role: 'worker', version: 'v1.28.3' },
        { name: 'worker-1', status: 'Ready', cpu: 52, memory: 71, role: 'worker', version: 'v1.28.3' },
        { name: 'worker-2', status: 'Ready', cpu: 34, memory: 58, role: 'worker', version: 'v1.28.3' },
      ],
      pods: [
        {
          name: 'frontend-7d8c9f-xk2pl',
          namespace: 'default',
          status: 'Running',
          restarts: 0,
        },
        {
          name: 'backend-5f6b8c-pl9mn',
          namespace: 'default',
          status: 'Running',
          restarts: 1,
        },
        {
          name: 'database-9k3j2-vc8xs',
          namespace: 'production',
          status: 'Running',
          restarts: 0,
        },
        {
          name: 'redis-cache-4k8j9-mn3pl',
          namespace: 'production',
          status: 'Running',
          restarts: 2,
        },
        {
          name: 'nginx-ingress-7d9k2-pl8xs',
          namespace: 'ingress-nginx',
          status: 'Running',
          restarts: 0,
        },
        {
          name: 'prometheus-server-8h2j4-xk9pl',
          namespace: 'monitoring',
          status: 'Running',
          restarts: 0,
        },
        {
          name: 'grafana-6f3k8-mn7xs',
          namespace: 'monitoring',
          status: 'Running',
          restarts: 0,
        },
      ],
      deployments: [
        { name: 'frontend', namespace: 'default', replicas: 3, ready: 3, status: 'Available' },
        { name: 'backend', namespace: 'default', replicas: 2, ready: 2, status: 'Available' },
        { name: 'database', namespace: 'production', replicas: 1, ready: 1, status: 'Available' },
        { name: 'redis-cache', namespace: 'production', replicas: 2, ready: 2, status: 'Available' },
        { name: 'nginx-ingress', namespace: 'ingress-nginx', replicas: 2, ready: 2, status: 'Available' },
        { name: 'prometheus-server', namespace: 'monitoring', replicas: 1, ready: 1, status: 'Available' },
        { name: 'grafana', namespace: 'monitoring', replicas: 1, ready: 1, status: 'Available' },
      ],
      services: [
        { name: 'frontend', namespace: 'default', type: 'LoadBalancer', clusterIP: '10.96.12.45' },
        { name: 'backend', namespace: 'default', type: 'ClusterIP', clusterIP: '10.96.15.78' },
        { name: 'database', namespace: 'production', type: 'ClusterIP', clusterIP: '10.96.8.23' },
        { name: 'redis', namespace: 'production', type: 'ClusterIP', clusterIP: '10.96.9.41' },
        { name: 'nginx-ingress', namespace: 'ingress-nginx', type: 'LoadBalancer', clusterIP: '10.96.1.10' },
      ],
      persistentVolumes: [
        { name: 'pv-data-001', capacity: '100Gi', status: 'Bound', storageClass: 'standard' },
        { name: 'pv-data-002', capacity: '50Gi', status: 'Bound', storageClass: 'fast' },
        { name: 'pv-data-003', capacity: '200Gi', status: 'Bound', storageClass: 'standard' },
        { name: 'pv-data-004', capacity: '100Gi', status: 'Available', storageClass: 'standard' },
      ],
      namespaces: [
        { name: 'default', status: 'Active', podCount: 5, age: '45d' },
        { name: 'production', status: 'Active', podCount: 12, age: '30d' },
        { name: 'staging', status: 'Active', podCount: 8, age: '25d' },
        { name: 'monitoring', status: 'Active', podCount: 6, age: '40d' },
        { name: 'ingress-nginx', status: 'Active', podCount: 3, age: '42d' },
        { name: 'kube-system', status: 'Active', podCount: 15, age: '45d' },
      ],
      events: [
        {
          type: 'Warning',
          reason: 'BackOff',
          message: 'Back-off restarting failed container',
          timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
          namespace: 'production',
        },
        {
          type: 'Normal',
          reason: 'Scheduled',
          message: 'Successfully assigned pod to worker-1',
          timestamp: new Date(now.getTime() - 10 * 60000).toISOString(),
          namespace: 'default',
        },
        {
          type: 'Warning',
          reason: 'FailedMount',
          message: 'Unable to mount volumes',
          timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
          namespace: 'staging',
        },
        {
          type: 'Normal',
          reason: 'Pulled',
          message: 'Container image pulled successfully',
          timestamp: new Date(now.getTime() - 20 * 60000).toISOString(),
          namespace: 'default',
        },
      ],
      clusterInfo: {
        version: 'OpenShift 4.14.5',
        kubernetesVersion: 'v1.28.3',
        platform: 'AWS',
        region: 'us-east-1',
        consoleURL: 'https://console.openshift.example.com',
        apiURL: 'https://api.openshift.example.com:6443',
        updateChannel: 'stable-4.14',
      },
      metrics: [
        { timestamp: new Date(now.getTime() - 60 * 60000).toISOString(), cpu: 42, memory: 68, pods: 45 },
        { timestamp: new Date(now.getTime() - 50 * 60000).toISOString(), cpu: 48, memory: 71, pods: 46 },
        { timestamp: new Date(now.getTime() - 40 * 60000).toISOString(), cpu: 55, memory: 74, pods: 47 },
        { timestamp: new Date(now.getTime() - 30 * 60000).toISOString(), cpu: 51, memory: 72, pods: 48 },
        { timestamp: new Date(now.getTime() - 20 * 60000).toISOString(), cpu: 47, memory: 70, pods: 49 },
        { timestamp: new Date(now.getTime() - 10 * 60000).toISOString(), cpu: 52, memory: 73, pods: 49 },
      ],
      storageInfo: {
        totalCapacity: '1000Gi',
        used: '450Gi',
        available: '550Gi',
        storageClasses: 3,
      },
    });
  },
}));
