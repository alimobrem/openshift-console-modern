// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useMonitor, emitMonitorEvent, _resetMonitorListeners } from '../useMonitor';
import type { Finding, Prediction, ActionReport } from '../useMonitor';

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-1',
    severity: 'warning',
    category: 'pod-health',
    title: 'Pod CrashLoopBackOff',
    summary: 'Pod api-server is crash-looping',
    resources: [{ kind: 'Pod', name: 'api-server', namespace: 'production' }],
    autoFixable: false,
    timestamp: Date.now(),
    ...overrides,
  };
}

function makePrediction(overrides: Partial<Prediction> = {}): Prediction {
  return {
    id: 'p-1',
    category: 'capacity',
    title: 'Node memory exhaustion',
    detail: 'Node worker-1 projected to run out of memory in 2h',
    eta: '2h',
    confidence: 0.85,
    resources: [{ kind: 'Node', name: 'worker-1' }],
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeActionReport(overrides: Partial<ActionReport> = {}): ActionReport {
  return {
    id: 'a-1',
    findingId: 'f-1',
    tool: 'restart_pod',
    status: 'proposed',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('useMonitor', () => {
  afterEach(() => {
    cleanup();
    _resetMonitorListeners();
  });

  it('starts with empty/disconnected state', () => {
    const { result } = renderHook(() => useMonitor());

    expect(result.current.connected).toBe(false);
    expect(result.current.findings).toEqual([]);
    expect(result.current.predictions).toEqual([]);
    expect(result.current.pendingActions).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.criticalCount).toBe(0);
    expect(result.current.warningCount).toBe(0);
  });

  it('updates connected state on status event', () => {
    const { result } = renderHook(() => useMonitor());

    act(() => emitMonitorEvent({ type: 'status', connected: true }));
    expect(result.current.connected).toBe(true);

    act(() => emitMonitorEvent({ type: 'status', connected: false }));
    expect(result.current.connected).toBe(false);
  });

  it('adds findings and increments unreadCount', () => {
    const { result } = renderHook(() => useMonitor());
    const finding = makeFinding();

    act(() => emitMonitorEvent({ type: 'finding', data: finding }));

    expect(result.current.findings).toHaveLength(1);
    expect(result.current.findings[0]).toEqual(finding);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.warningCount).toBe(1);
  });

  it('deduplicates findings by id', () => {
    const { result } = renderHook(() => useMonitor());
    const finding1 = makeFinding({ id: 'f-1', title: 'First' });
    const finding2 = makeFinding({ id: 'f-1', title: 'Updated' });

    act(() => emitMonitorEvent({ type: 'finding', data: finding1 }));
    act(() => emitMonitorEvent({ type: 'finding', data: finding2 }));

    expect(result.current.findings).toHaveLength(1);
    expect(result.current.findings[0].title).toBe('Updated');
  });

  it('tracks severity counts correctly', () => {
    const { result } = renderHook(() => useMonitor());

    act(() => {
      emitMonitorEvent({ type: 'finding', data: makeFinding({ id: 'f-1', severity: 'critical' }) });
      emitMonitorEvent({ type: 'finding', data: makeFinding({ id: 'f-2', severity: 'critical' }) });
      emitMonitorEvent({ type: 'finding', data: makeFinding({ id: 'f-3', severity: 'warning' }) });
      emitMonitorEvent({ type: 'finding', data: makeFinding({ id: 'f-4', severity: 'info' }) });
    });

    expect(result.current.criticalCount).toBe(2);
    expect(result.current.warningCount).toBe(1);
    expect(result.current.findings).toHaveLength(4);
  });

  it('dismissFinding removes a finding', () => {
    const { result } = renderHook(() => useMonitor());

    act(() => {
      emitMonitorEvent({ type: 'finding', data: makeFinding({ id: 'f-1' }) });
      emitMonitorEvent({ type: 'finding', data: makeFinding({ id: 'f-2' }) });
    });

    expect(result.current.findings).toHaveLength(2);

    act(() => result.current.dismissFinding('f-1'));

    expect(result.current.findings).toHaveLength(1);
    expect(result.current.findings[0].id).toBe('f-2');
  });

  it('markAllRead resets unreadCount to 0', () => {
    const { result } = renderHook(() => useMonitor());

    act(() => {
      emitMonitorEvent({ type: 'finding', data: makeFinding({ id: 'f-1' }) });
      emitMonitorEvent({ type: 'finding', data: makeFinding({ id: 'f-2' }) });
    });

    expect(result.current.unreadCount).toBe(2);

    act(() => result.current.markAllRead());

    expect(result.current.unreadCount).toBe(0);
  });

  it('handles predictions', () => {
    const { result } = renderHook(() => useMonitor());
    const prediction = makePrediction();

    act(() => emitMonitorEvent({ type: 'prediction', data: prediction }));

    expect(result.current.predictions).toHaveLength(1);
    expect(result.current.predictions[0]).toEqual(prediction);
  });

  it('deduplicates predictions by id', () => {
    const { result } = renderHook(() => useMonitor());

    act(() => {
      emitMonitorEvent({ type: 'prediction', data: makePrediction({ id: 'p-1', title: 'First' }) });
      emitMonitorEvent({ type: 'prediction', data: makePrediction({ id: 'p-1', title: 'Updated' }) });
    });

    expect(result.current.predictions).toHaveLength(1);
    expect(result.current.predictions[0].title).toBe('Updated');
  });

  it('tracks pending actions for proposed status, removes on completion', () => {
    const { result } = renderHook(() => useMonitor());

    act(() => emitMonitorEvent({ type: 'action_report', data: makeActionReport({ id: 'a-1', status: 'proposed' }) }));

    expect(result.current.pendingActions).toHaveLength(1);

    act(() => emitMonitorEvent({ type: 'action_report', data: makeActionReport({ id: 'a-1', status: 'completed' }) }));

    expect(result.current.pendingActions).toHaveLength(0);
  });

  it('cleans up listener on unmount', () => {
    const { result, unmount } = renderHook(() => useMonitor());

    act(() => emitMonitorEvent({ type: 'finding', data: makeFinding({ id: 'f-1' }) }));
    expect(result.current.findings).toHaveLength(1);

    unmount();

    // Emitting after unmount should not throw
    expect(() => {
      emitMonitorEvent({ type: 'finding', data: makeFinding({ id: 'f-2' }) });
    }).not.toThrow();
  });
});
