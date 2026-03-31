/**
 * Intent Store — manages intent engine state.
 * Users express desired outcomes in natural language; the system generates
 * execution plans with simulation results for approval.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SimulationResult, AgentRef } from '../engine/types/mvpTypes';

export type IntentStatus =
  | 'planning'
  | 'simulating'
  | 'pending_review'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'rejected';

export interface PlanStep {
  id: string;
  label: string;
  description: string;
  agent: AgentRef;
  status: 'pending' | 'running' | 'done' | 'error';
  durationMs?: number;
}

export interface Intent {
  id: string;
  input: string;
  status: IntentStatus;
  plan: PlanStep[];
  simulation: SimulationResult | null;
  createdAt: number;
  updatedAt: number;
}

interface IntentState {
  intents: Intent[];
  activeIntentId: string | null;
  draftInput: string;

  setDraftInput: (input: string) => void;
  submitIntent: (input: string) => void;
  setActiveIntent: (id: string | null) => void;
  approveIntent: (id: string) => void;
  rejectIntent: (id: string) => void;
  clearIntents: () => void;
}

function makeId(): string {
  return `intent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeStepId(): string {
  return `step-${Math.random().toString(36).slice(2, 8)}`;
}

const AGENTS: AgentRef[] = [
  { id: 'sre', name: 'SRE Agent', icon: 'Shield', color: 'text-blue-400' },
  { id: 'security', name: 'Security Agent', icon: 'Lock', color: 'text-emerald-400' },
  { id: 'capacity', name: 'Capacity Agent', icon: 'BarChart3', color: 'text-amber-400' },
  { id: 'network', name: 'Network Agent', icon: 'Globe', color: 'text-cyan-400' },
];

function generatePlan(input: string): PlanStep[] {
  const lower = input.toLowerCase();

  if (lower.includes('scale') || lower.includes('replica')) {
    return [
      { id: makeStepId(), label: 'Analyze current load', description: 'Check CPU/memory utilization across target deployments', agent: AGENTS[0], status: 'pending' },
      { id: makeStepId(), label: 'Calculate target replicas', description: 'Determine optimal replica count based on resource requests and limits', agent: AGENTS[2], status: 'pending' },
      { id: makeStepId(), label: 'Validate quota headroom', description: 'Ensure namespace quota allows the requested scale', agent: AGENTS[0], status: 'pending' },
      { id: makeStepId(), label: 'Apply scaling changes', description: 'Patch deployment replica count and update HPA bounds', agent: AGENTS[0], status: 'pending' },
    ];
  }

  if (lower.includes('tls') || lower.includes('certificate') || lower.includes('encrypt')) {
    return [
      { id: makeStepId(), label: 'Audit TLS configuration', description: 'Scan all routes and ingress objects for TLS termination settings', agent: AGENTS[1], status: 'pending' },
      { id: makeStepId(), label: 'Generate certificates', description: 'Create or renew certificates via cert-manager', agent: AGENTS[1], status: 'pending' },
      { id: makeStepId(), label: 'Update route TLS', description: 'Patch routes to use edge/reencrypt termination with new certs', agent: AGENTS[3], status: 'pending' },
      { id: makeStepId(), label: 'Verify connectivity', description: 'Confirm HTTPS endpoints respond with valid certificates', agent: AGENTS[3], status: 'pending' },
    ];
  }

  if (lower.includes('network') || lower.includes('policy') || lower.includes('isolat')) {
    return [
      { id: makeStepId(), label: 'Map current network flows', description: 'Discover pod-to-pod and pod-to-service communication paths', agent: AGENTS[3], status: 'pending' },
      { id: makeStepId(), label: 'Generate NetworkPolicy', description: 'Create deny-all base with allow rules for observed traffic', agent: AGENTS[1], status: 'pending' },
      { id: makeStepId(), label: 'Dry-run policy', description: 'Simulate policy enforcement against current traffic', agent: AGENTS[3], status: 'pending' },
      { id: makeStepId(), label: 'Apply policies', description: 'Deploy NetworkPolicy resources to target namespaces', agent: AGENTS[3], status: 'pending' },
    ];
  }

  // Default generic plan
  return [
    { id: makeStepId(), label: 'Analyze cluster state', description: 'Gather current resource status and metrics', agent: AGENTS[0], status: 'pending' },
    { id: makeStepId(), label: 'Generate execution plan', description: 'Determine required changes based on intent', agent: AGENTS[0], status: 'pending' },
    { id: makeStepId(), label: 'Simulate changes', description: 'Predict impact on cost, security, and performance', agent: AGENTS[2], status: 'pending' },
    { id: makeStepId(), label: 'Apply changes', description: 'Execute the approved modifications', agent: AGENTS[0], status: 'pending' },
  ];
}

function generateSimulation(input: string): SimulationResult {
  const lower = input.toLowerCase();
  const isScale = lower.includes('scale') || lower.includes('replica');
  const isSecurity = lower.includes('tls') || lower.includes('certificate') || lower.includes('network') || lower.includes('policy');

  return {
    costDelta: {
      current: 100,
      projected: isScale ? 135 : 105,
      changePercent: isScale ? 35 : 5,
    },
    securityPosture: {
      current: 72,
      projected: isSecurity ? 91 : 72,
      details: isSecurity
        ? ['TLS enforced on all routes', 'Network segmentation improved', 'Certificate auto-renewal configured']
        : ['No security impact detected'],
    },
    resourceImpact: {
      added: isScale ? ['HorizontalPodAutoscaler/api-server'] : [],
      removed: [],
      modified: isScale
        ? ['Deployment/api-server', 'Deployment/worker']
        : isSecurity
          ? ['Route/api', 'Route/web', 'NetworkPolicy/default-deny']
          : ['ConfigMap/app-config'],
    },
    latencyEstimate: { p50Ms: isScale ? 12 : 45, p99Ms: isScale ? 85 : 200 },
    riskScore: isSecurity ? 'medium' : 'low',
    confidence: isSecurity ? 0.87 : 0.94,
    executionTimeMinutes: isScale ? 3 : isSecurity ? 8 : 5,
  };
}

export const useIntentStore = create<IntentState>()(
  persist(
    (set, get) => ({
      intents: [],
      activeIntentId: null,
      draftInput: '',

      setDraftInput: (input) => set({ draftInput: input }),

      submitIntent: (input) => {
        const id = makeId();
        const now = Date.now();
        const intent: Intent = {
          id,
          input,
          status: 'planning',
          plan: [],
          simulation: null,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          intents: [intent, ...state.intents],
          activeIntentId: id,
          draftInput: '',
        }));

        // Simulate planning phase
        setTimeout(() => {
          const state = get();
          const target = state.intents.find((i) => i.id === id);
          if (!target || target.status !== 'planning') return;

          set((s) => ({
            intents: s.intents.map((i) =>
              i.id === id
                ? { ...i, plan: generatePlan(input), status: 'simulating' as IntentStatus, updatedAt: Date.now() }
                : i
            ),
          }));

          // Simulate simulation phase
          setTimeout(() => {
            const state2 = get();
            const target2 = state2.intents.find((i) => i.id === id);
            if (!target2 || target2.status !== 'simulating') return;

            set((s) => ({
              intents: s.intents.map((i) =>
                i.id === id
                  ? { ...i, simulation: generateSimulation(input), status: 'pending_review' as IntentStatus, updatedAt: Date.now() }
                  : i
              ),
            }));
          }, 800);
        }, 800);
      },

      setActiveIntent: (id) => set({ activeIntentId: id }),

      approveIntent: (id) => {
        set((state) => ({
          intents: state.intents.map((i) =>
            i.id === id ? { ...i, status: 'approved' as IntentStatus, updatedAt: Date.now() } : i
          ),
        }));

        // Simulate execution
        setTimeout(() => {
          set((state) => ({
            intents: state.intents.map((i) =>
              i.id === id ? { ...i, status: 'executing' as IntentStatus, updatedAt: Date.now() } : i
            ),
          }));

          // Auto-advance steps
          const intent = get().intents.find((i) => i.id === id);
          if (!intent) return;
          const steps = intent.plan;
          let delay = 600;
          steps.forEach((step, idx) => {
            setTimeout(() => {
              set((s) => ({
                intents: s.intents.map((i) => {
                  if (i.id !== id) return i;
                  const newPlan = i.plan.map((p, j) => {
                    if (j < idx) return { ...p, status: 'done' as const };
                    if (j === idx) return { ...p, status: 'running' as const };
                    return p;
                  });
                  return { ...i, plan: newPlan, updatedAt: Date.now() };
                }),
              }));
            }, delay);
            delay += 800;
          });

          // Mark completed after all steps
          setTimeout(() => {
            set((s) => ({
              intents: s.intents.map((i) => {
                if (i.id !== id) return i;
                return {
                  ...i,
                  status: 'completed' as IntentStatus,
                  plan: i.plan.map((p) => ({ ...p, status: 'done' as const })),
                  updatedAt: Date.now(),
                };
              }),
            }));
          }, delay);
        }, 400);
      },

      rejectIntent: (id) => {
        set((state) => ({
          intents: state.intents.map((i) =>
            i.id === id ? { ...i, status: 'rejected' as IntentStatus, updatedAt: Date.now() } : i
          ),
        }));
      },

      clearIntents: () => set({ intents: [], activeIntentId: null, draftInput: '' }),
    }),
    {
      name: 'openshiftpulse-intents',
      partialize: (state) => ({
        intents: state.intents.slice(0, 50),
        activeIntentId: state.activeIntentId,
      }),
    },
  ),
);
