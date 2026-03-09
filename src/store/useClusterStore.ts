import { create } from 'zustand';
import * as k8s from '@/lib/k8s';

export interface Node {
  name: string;
  status: 'Ready' | 'NotReady';
  cpu: number;
  memory: number;
  role: string;
  version: string;
}

export interface Pod {
  name: string;
  namespace: string;
  status: 'Running' | 'Pending' | 'Failed';
  restarts: number;
}

export interface Deployment {
  name: string;
  namespace: string;
  replicas: number;
  ready: number;
  status: 'Available' | 'Progressing' | 'Failed';
}

export interface Service {
  name: string;
  namespace: string;
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  clusterIP: string;
}

export interface PersistentVolume {
  name: string;
  capacity: string;
  status: 'Bound' | 'Available' | 'Released';
  storageClass: string;
}

export interface Namespace {
  name: string;
  status: 'Active' | 'Terminating';
  podCount: number;
  age: string;
}

export interface Event {
  type: 'Warning' | 'Error' | 'Normal';
  reason: string;
  message: string;
  timestamp: string;
  namespace: string;
}

export interface ClusterInfo {
  version: string;
  kubernetesVersion: string;
  platform: string;
  region: string;
  consoleURL: string;
  apiURL: string;
  updateChannel: string;
}

export interface ResourceMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  pods: number;
}

export interface StorageInfo {
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
  isLoading: boolean;
  error: string | null;
  pollingInterval: ReturnType<typeof setInterval> | null;
  pendingTimers: ReturnType<typeof setTimeout>[];
  setSelectedNamespace: (namespace: string) => void;
  fetchClusterData: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  // Admin actions
  scaleDeployment: (namespace: string, name: string, replicas: number) => void;
  deletePod: (namespace: string, name: string) => void;
  restartPod: (namespace: string, name: string) => void;
  addNamespace: (name: string) => void;
  deleteNamespace: (name: string) => void;
  addDeployment: (name: string, namespace: string, image: string, replicas: number) => void;
}


export const useClusterStore = create<ClusterStore>((set, get) => ({
  nodes: [],
  pods: [],
  deployments: [],
  services: [],
  persistentVolumes: [],
  namespaces: [],
  events: [],
  clusterInfo: null,
  metrics: [],
  isLoading: false,
  error: null,
  pendingTimers: [],
  storageInfo: null,
  selectedNamespace: 'all',
  pollingInterval: null,

  setSelectedNamespace: (namespace) => set({ selectedNamespace: namespace }),

  fetchClusterData: async () => {
    set({ isLoading: true, error: null });

    // Try real cluster first
    const connected = await k8s.checkClusterConnection();
    if (connected) {
      try {
        const [nodes, pods, deployments, services, namespaces, events, pvs] = await Promise.all([
          k8s.fetchNodes(),
          k8s.fetchPods(),
          k8s.fetchDeployments(),
          k8s.fetchServices(),
          k8s.fetchNamespaces(),
          k8s.fetchEvents(),
          k8s.fetchPersistentVolumes(),
        ]);
        set({
          nodes, pods, deployments, services, namespaces, events,
          persistentVolumes: pvs,
          clusterInfo: { version: 'OpenShift (live)', kubernetesVersion: nodes[0]?.version ?? '', platform: 'Live Cluster', region: '-', consoleURL: window.location.origin, apiURL: 'via kubectl proxy', updateChannel: '-' },
          metrics: [{ timestamp: new Date().toISOString(), cpu: 0, memory: 0, pods: pods.length }],
          storageInfo: { totalCapacity: '-', used: '-', available: '-', storageClasses: 0 },
          isLoading: false,
        });
        return;
      } catch (err) {
        set({ error: `Cluster API error: ${err instanceof Error ? err.message : String(err)}` });
      }
    }

    // No cluster connection available
    set({
      isLoading: false,
      error: 'Cannot connect to cluster. Run: oc proxy --port=8001',
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
    });
  },

  startPolling: () => {
    const existing = get().pollingInterval;
    if (existing) return;

    const interval = setInterval(async () => {
      // Re-fetch live data from cluster
      try {
        const [pods, events, nodes] = await Promise.all([
          k8s.fetchPods(),
          k8s.fetchEvents(),
          k8s.fetchNodes(),
        ]);
        const now = new Date();
        set((state) => {
          const newMetric: ResourceMetrics = {
            timestamp: now.toISOString(),
            cpu: 0,
            memory: 0,
            pods: pods.length,
          };
          return {
            pods,
            events,
            nodes,
            metrics: [...state.metrics.slice(-11), newMetric],
          };
        });
      } catch {
        // Silently ignore polling errors
      }
    }, 10000);

    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const interval = get().pollingInterval;
    if (interval) {
      clearInterval(interval);
      set({ pollingInterval: null });
    }
  },

  scaleDeployment: (namespace, name, replicas) => {
    set((state) => ({
      deployments: state.deployments.map((d) =>
        d.namespace === namespace && d.name === name
          ? { ...d, replicas, ready: Math.min(d.ready, replicas) }
          : d
      ),
    }));
    // Simulate ready catching up after 2s
    const timer1 = setTimeout(() => {
      set((state) => ({
        deployments: state.deployments.map((d) =>
          d.namespace === namespace && d.name === name
            ? { ...d, ready: d.replicas }
            : d
        ),
      }));
    }, 2000);
    set((s) => ({ pendingTimers: [...s.pendingTimers, timer1] }));
  },

  deletePod: (namespace, name) => {
    set((state) => ({
      pods: state.pods.filter((p) => !(p.namespace === namespace && p.name === name)),
      events: [
        { type: 'Normal' as const, reason: 'Killing', message: `Stopping container in pod ${name}`, timestamp: new Date().toISOString(), namespace },
        ...state.events.slice(0, 19),
      ],
    }));
  },

  restartPod: (namespace, name) => {
    set((state) => ({
      pods: state.pods.map((p) =>
        p.namespace === namespace && p.name === name
          ? { ...p, restarts: p.restarts + 1, status: 'Pending' as const }
          : p
      ),
      events: [
        { type: 'Normal' as const, reason: 'Restarting', message: `Restarting pod ${name}`, timestamp: new Date().toISOString(), namespace },
        ...state.events.slice(0, 19),
      ],
    }));
    // Simulate restart completing after 3s
    const timer2 = setTimeout(() => {
      set((state) => ({
        pods: state.pods.map((p) =>
          p.namespace === namespace && p.name === name
            ? { ...p, status: 'Running' as const }
            : p
        ),
      }));
    }, 3000);
    set((s) => ({ pendingTimers: [...s.pendingTimers, timer2] }));
  },

  addNamespace: (name) => {
    set((state) => ({
      namespaces: [...state.namespaces, { name, status: 'Active' as const, podCount: 0, age: '0d' }],
    }));
  },

  deleteNamespace: (name) => {
    set((state) => ({
      namespaces: state.namespaces.filter((ns) => ns.name !== name),
    }));
  },

  addDeployment: (name, namespace, _image, replicas) => {
    set((state) => ({
      deployments: [...state.deployments, { name, namespace, replicas, ready: 0, status: 'Progressing' as const }],
      events: [
        { type: 'Normal' as const, reason: 'ScalingReplicaSet', message: `Scaled up replica set ${name} to ${replicas}`, timestamp: new Date().toISOString(), namespace },
        ...state.events.slice(0, 19),
      ],
    }));
    // Simulate pods becoming ready
    const timer3 = setTimeout(() => {
      set((state) => ({
        deployments: state.deployments.map((d) =>
          d.namespace === namespace && d.name === name
            ? { ...d, ready: d.replicas, status: 'Available' as const }
            : d
        ),
        pods: [
          ...state.pods,
          ...Array.from({ length: replicas }, () => ({
            name: `${name}-${Math.random().toString(36).slice(2, 7)}-${Math.random().toString(36).slice(2, 7)}`,
            namespace,
            status: 'Running' as const,
            restarts: 0,
          })),
        ],
      }));
    }, 3000);
    set((s) => ({ pendingTimers: [...s.pendingTimers, timer3] }));
  },
}));
