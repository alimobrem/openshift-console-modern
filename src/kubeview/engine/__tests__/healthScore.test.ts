import { describe, it, expect } from 'vitest';
import { computeHealthScore, healthGradeColor, type HealthScoreInput } from '../healthScore';

function makeInput(overrides: Partial<HealthScoreInput> = {}): HealthScoreInput {
  return {
    nodeCount: 3,
    nodeReadyCount: 3,
    podCount: 50,
    podFailedCount: 0,
    operatorCount: 10,
    operatorDegradedCount: 0,
    alertCriticalCount: 0,
    alertWarningCount: 0,
    ...overrides,
  };
}

describe('computeHealthScore', () => {
  it('returns 100 when everything is healthy', () => {
    const result = computeHealthScore(makeInput());
    expect(result.score).toBe(100);
    expect(result.grade).toBe('healthy');
    expect(result.factors).toHaveLength(0);
  });

  it('deducts up to 30 points for node failures', () => {
    const result = computeHealthScore(makeInput({ nodeCount: 3, nodeReadyCount: 0 }));
    expect(result.score).toBe(70);
    expect(result.grade).toBe('warning');
    expect(result.factors).toContainEqual(expect.objectContaining({ label: 'Nodes', impact: -30 }));
  });

  it('deducts partial node impact', () => {
    const result = computeHealthScore(makeInput({ nodeCount: 3, nodeReadyCount: 2 }));
    expect(result.score).toBe(90);
    expect(result.grade).toBe('healthy');
  });

  it('deducts up to 25 points for degraded operators', () => {
    const result = computeHealthScore(makeInput({ operatorCount: 10, operatorDegradedCount: 10 }));
    expect(result.score).toBe(75);
    expect(result.grade).toBe('warning');
    expect(result.factors).toContainEqual(expect.objectContaining({ label: 'Operators' }));
  });

  it('deducts for critical alerts capped at 25', () => {
    const result = computeHealthScore(makeInput({ alertCriticalCount: 5 }));
    expect(result.score).toBe(75);
    expect(result.factors).toContainEqual(expect.objectContaining({ label: 'Critical Alerts', detail: '5 firing' }));
  });

  it('caps critical alert impact at 25', () => {
    const result = computeHealthScore(makeInput({ alertCriticalCount: 100 }));
    expect(result.score).toBe(75);
  });

  it('deducts for warning alerts capped at 10', () => {
    const result = computeHealthScore(makeInput({ alertWarningCount: 3 }));
    expect(result.score).toBe(94);
  });

  it('caps warning alert impact at 10', () => {
    const result = computeHealthScore(makeInput({ alertWarningCount: 100 }));
    expect(result.score).toBe(90);
    expect(result.grade).toBe('healthy');
  });

  it('deducts for pod failures', () => {
    const result = computeHealthScore(makeInput({ podCount: 50, podFailedCount: 10 }));
    expect(result.score).toBe(90);
    expect(result.factors).toContainEqual(expect.objectContaining({ label: 'Pods', detail: '10 failed' }));
  });

  it('handles combined degradation', () => {
    const result = computeHealthScore(makeInput({
      nodeCount: 3, nodeReadyCount: 1,
      operatorCount: 10, operatorDegradedCount: 5,
      alertCriticalCount: 2,
      alertWarningCount: 5,
      podCount: 100, podFailedCount: 20,
    }));
    expect(result.score).toBeLessThan(60);
    expect(['degraded', 'critical']).toContain(result.grade);
    expect(result.factors.length).toBeGreaterThanOrEqual(4);
  });

  it('clamps score to 0 minimum', () => {
    const result = computeHealthScore(makeInput({
      nodeCount: 3, nodeReadyCount: 0,
      operatorCount: 10, operatorDegradedCount: 10,
      alertCriticalCount: 10,
      alertWarningCount: 20,
      podCount: 50, podFailedCount: 50,
    }));
    expect(result.score).toBe(0);
    expect(result.grade).toBe('critical');
  });

  it('returns correct grade boundaries', () => {
    // 90+ = healthy
    expect(computeHealthScore(makeInput({ alertWarningCount: 3 })).grade).toBe('healthy');
    // 70-89 = warning
    expect(computeHealthScore(makeInput({ nodeCount: 3, nodeReadyCount: 0 })).grade).toBe('warning');
    // 50-69 = degraded
    expect(computeHealthScore(makeInput({
      nodeCount: 3, nodeReadyCount: 0, alertCriticalCount: 1,
    })).grade).toBe('degraded');
    // <50 = critical
    expect(computeHealthScore(makeInput({
      nodeCount: 3, nodeReadyCount: 0, operatorCount: 10, operatorDegradedCount: 10,
    })).grade).toBe('critical');
  });

  it('returns correct colors', () => {
    expect(computeHealthScore(makeInput()).color).toBe('text-emerald-400');
    expect(computeHealthScore(makeInput({ nodeCount: 3, nodeReadyCount: 0 })).color).toBe('text-amber-400');
  });

  it('handles zero counts gracefully', () => {
    const result = computeHealthScore(makeInput({
      nodeCount: 0, nodeReadyCount: 0,
      podCount: 0, podFailedCount: 0,
      operatorCount: 0, operatorDegradedCount: 0,
    }));
    expect(result.score).toBe(100);
  });
});

describe('healthGradeColor', () => {
  it('maps each grade to correct bg class', () => {
    expect(healthGradeColor('healthy')).toBe('bg-emerald-500');
    expect(healthGradeColor('warning')).toBe('bg-amber-500');
    expect(healthGradeColor('degraded')).toBe('bg-orange-500');
    expect(healthGradeColor('critical')).toBe('bg-red-500');
  });
});
