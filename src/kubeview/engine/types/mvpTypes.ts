/**
 * MVP Types — shared type definitions for v6 features
 * (Intent Engine, Simulation Sandbox, Marketplace, etc.)
 */

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SimulationResult {
  costDelta: { current: number; projected: number; changePercent: number };
  securityPosture: { current: number; projected: number; details: string[] };
  resourceImpact: { added: string[]; removed: string[]; modified: string[] };
  latencyEstimate: { p50Ms: number; p99Ms: number };
  riskScore: RiskLevel;
  confidence: number;
  executionTimeMinutes: number;
}

export interface AgentRef {
  id: string;
  name: string;
  icon: string;
  color: string;
}
