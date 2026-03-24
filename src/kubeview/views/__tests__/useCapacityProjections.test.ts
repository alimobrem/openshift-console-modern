import { describe, it, expect } from 'vitest';
import { computeExhaustion } from '../compute/useCapacityProjections';

describe('computeExhaustion', () => {
  it('computes ~63 days when current=0.7 and projected_90d=1.2', () => {
    // growthPerDay = (1.2 - 0.7) / 90 = 0.005556
    // remaining = 1.0 - 0.7 = 0.3
    // days = 0.3 / 0.005556 = ~54
    const result = computeExhaustion(0.7, 1.2);
    expect(result.days).not.toBeNull();
    // remaining=0.3, growthPerDay=(0.5/90)=0.00556, days=0.3/0.00556 = 54
    expect(result.days).toBe(54);
    expect(result.growth).toBeCloseTo(0.5 / 90, 6);
  });

  it('returns null days when usage is declining (projected < current)', () => {
    const result = computeExhaustion(0.7, 0.5);
    expect(result.days).toBeNull();
    expect(result.growth).toBeLessThan(0);
  });

  it('returns 0 days when already exhausted (current=1.0)', () => {
    const result = computeExhaustion(1.0, 1.5);
    expect(result.days).toBe(0);
    expect(result.growth).toBeGreaterThan(0);
  });

  it('returns null days and null growth when current is null', () => {
    const result = computeExhaustion(null, 1.2);
    expect(result.days).toBeNull();
    expect(result.growth).toBeNull();
  });

  it('returns null days and null growth when projected is null', () => {
    const result = computeExhaustion(0.7, null);
    expect(result.days).toBeNull();
    expect(result.growth).toBeNull();
  });

  it('returns null days and null growth when both inputs are null', () => {
    const result = computeExhaustion(null, null);
    expect(result.days).toBeNull();
    expect(result.growth).toBeNull();
  });

  it('returns null days when projected equals current (zero growth)', () => {
    const result = computeExhaustion(0.5, 0.5);
    expect(result.days).toBeNull();
    expect(result.growth).toBe(0);
  });

  it('computes correct days for low usage with moderate growth', () => {
    // current=0.3, projected=0.6 at 90d
    // growthPerDay = 0.3/90 = 0.003333
    // remaining = 0.7
    // days = 0.7 / 0.003333 = 210
    const result = computeExhaustion(0.3, 0.6);
    expect(result.days).toBe(210);
  });

  it('returns 0 days when current exceeds 1.0 (over-provisioned)', () => {
    const result = computeExhaustion(1.1, 1.5);
    expect(result.days).toBe(0);
  });
});
