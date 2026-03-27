/**
 * Onboarding types — re-exports from the readiness engine plus UI-specific types.
 *
 * All gate/readiness types are defined in engine/readiness/types.ts.
 * This file adds UI-specific types and helpers.
 */

export type {
  GateStatus,
  GatePriority,
  GateContext,
  Waiver,
} from '../../engine/readiness/types';

import type {
  ReadinessCategory,
  ReadinessGate,
  GateResult,
  CategorySummary,
  ReadinessReport,
} from '../../engine/readiness/types';

export type { ReadinessCategory, ReadinessGate, GateResult, CategorySummary, ReadinessReport };

/** Whether the user is seeing the wizard (first-run) or checklist (returning) */
export type OnboardingMode = 'wizard' | 'checklist';

/** UI-friendly category descriptor for rendering step components */
export interface CategoryDescriptor {
  id: ReadinessCategory;
  label: string;
  description: string;
}

/**
 * UI-friendly category view that combines gate definitions, their results,
 * and the category summary into a single object for rendering.
 */
export interface CategoryView {
  id: ReadinessCategory;
  label: string;
  description: string;
  gates: ReadinessGate[];
  results: Record<string, GateResult>;
  summary: CategorySummary;
}

/** Category metadata for building CategoryViews */
const CATEGORY_META: Record<ReadinessCategory, { label: string; description: string }> = {
  prerequisites: { label: 'Prerequisites', description: 'Cluster basics that must be in place before anything else.' },
  security: { label: 'Security', description: 'Authentication, authorization, and network policy gates.' },
  reliability: { label: 'Reliability', description: 'High availability, resource limits, and disruption budgets.' },
  observability: { label: 'Observability', description: 'Monitoring, alerting, and logging infrastructure.' },
  operations: { label: 'Operations', description: 'Backup, update strategy, and operational procedures.' },
  gitops: { label: 'GitOps', description: 'GitOps operator, repository, and application configuration.' },
};

/** Build CategoryView[] from engine data for use in UI components. */
export function buildCategoryViews(
  results: Record<string, GateResult>,
  summaries: Record<ReadinessCategory, CategorySummary>,
  gates: ReadinessGate[],
): CategoryView[] {
  const categories: ReadinessCategory[] = [
    'prerequisites', 'security', 'reliability', 'observability', 'operations', 'gitops',
  ];

  return categories.map((catId) => {
    const meta = CATEGORY_META[catId];
    const catGates = gates.filter((g) => g.category === catId);
    const catResults: Record<string, GateResult> = {};
    for (const g of catGates) {
      if (results[g.id]) {
        catResults[g.id] = results[g.id];
      }
    }
    return {
      id: catId,
      label: meta.label,
      description: meta.description,
      gates: catGates,
      results: catResults,
      summary: summaries[catId] ?? { passed: 0, failed: 0, needs_attention: 0, not_started: catGates.length, total: catGates.length, score: 0 },
    };
  });
}

/** Compute a 0-100 score from a ReadinessReport's category summaries. */
export function computeScore(
  categories: Record<string, CategorySummary>,
): number {
  let totalGates = 0;
  let passedGates = 0;
  for (const cat of Object.values(categories)) {
    totalGates += cat.total;
    passedGates += cat.passed;
  }
  return totalGates > 0 ? Math.round((passedGates / totalGates) * 100) : 0;
}
