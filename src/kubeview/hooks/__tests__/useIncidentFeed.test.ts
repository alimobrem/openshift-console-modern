// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mocks — must be defined before the module under test is imported

// Mock useMonitorStore
const mockFindings: Array<{
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  summary: string;
  resources: Array<{ kind: string; name: string; namespace?: string }>;
  autoFixable: boolean;
  timestamp: number;
}> = [];

vi.mock('../../store/monitorStore', () => ({
  useMonitorStore: (selector: (s: { findings: typeof mockFindings }) => unknown) =>
    selector({ findings: mockFindings }),
}));

// Mock useErrorStore
const mockErrors: Array<{
  id: string;
  timestamp: number;
  category: string;
  message: string;
  userMessage: string;
  statusCode: number;
  operation: string;
  resourceKind?: string;
  resourceName?: string;
  namespace?: string;
  suggestions: string[];
  resolved: boolean;
}> = [];

vi.mock('../../store/errorStore', () => ({
  useErrorStore: (selector: (s: { errors: typeof mockErrors }) => unknown) =>
    selector({ errors: mockErrors }),
}));

// Mock useQuery (Prometheus alerts)
let mockAlertGroups: unknown[] = [];
let mockAlertsLoading = false;

vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: { queryKey: string[]; enabled?: boolean }) => {
    if (opts.queryKey[0] === 'incidentFeed') {
      return { data: mockAlertGroups, isLoading: mockAlertsLoading };
    }
    // timeline queries
    return { data: [], isLoading: false };
  },
}));

// Mock useIncidentTimeline
const mockTimelineEntries: unknown[] = [];

vi.mock('../useIncidentTimeline', () => ({
  useIncidentTimeline: () => ({
    entries: mockTimelineEntries,
    isLoading: false,
    correlationGroups: [],
    counts: { alert: 0, event: 0, rollout: 0, config: 0 },
  }),
}));

// Mock useK8sListWatch (needed by useIncidentTimeline's transitive imports)
vi.mock('../useK8sListWatch', () => ({
  useK8sListWatch: () => ({ data: [], isLoading: false }),
}));

import { useIncidentFeed } from '../useIncidentFeed';

function makeFinding(overrides: Partial<typeof mockFindings[0]> = {}) {
  return {
    id: 'f-1',
    severity: 'warning' as const,
    category: 'pod-health',
    title: 'Pod CrashLoopBackOff',
    summary: 'Pod api-server is crash-looping',
    resources: [{ kind: 'Pod', name: 'api-server', namespace: 'production' }],
    autoFixable: false,
    timestamp: 1000,
    ...overrides,
  };
}

function makeError(overrides: Partial<typeof mockErrors[0]> = {}) {
  return {
    id: 'e-1',
    timestamp: 2000,
    category: 'server',
    message: 'Internal server error',
    userMessage: 'Something went wrong',
    statusCode: 500,
    operation: 'get',
    resourceKind: 'Deployment',
    resourceName: 'web-app',
    namespace: 'staging',
    suggestions: [],
    resolved: false,
    ...overrides,
  };
}

function makeAlertGroup(alerts: Array<{
  name: string;
  severity?: string;
  labels?: Record<string, string>;
  activeAt?: string;
}>) {
  return {
    name: 'test-group',
    rules: alerts.map((a) => ({
      name: a.name,
      type: 'alerting',
      labels: { severity: a.severity ?? 'warning' },
      annotations: { description: `${a.name} is firing` },
      alerts: [
        {
          labels: { severity: a.severity ?? 'warning', ...a.labels },
          annotations: { description: `${a.name} is firing` },
          state: 'firing' as const,
          activeAt: a.activeAt ?? '2026-01-01T00:00:00Z',
        },
      ],
    })),
  };
}

function makeTimelineEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tl-1',
    timestamp: '2026-01-01T00:05:00Z',
    category: 'event',
    severity: 'warning',
    title: 'Pod restarted',
    detail: 'Container exited with code 1',
    namespace: 'default',
    resource: { apiVersion: 'v1', kind: 'Pod', name: 'worker-1', namespace: 'default' },
    correlationKey: 'Pod/worker-1/default',
    source: { type: 'k8s-event' },
    ...overrides,
  };
}

describe('useIncidentFeed', () => {
  beforeEach(() => {
    mockFindings.length = 0;
    mockErrors.length = 0;
    mockAlertGroups = [];
    mockAlertsLoading = false;
    mockTimelineEntries.length = 0;
  });

  it('returns empty state when no sources have data', () => {
    const { result } = renderHook(() => useIncidentFeed());

    expect(result.current.incidents).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.counts).toEqual({ critical: 0, warning: 0, info: 0, total: 0 });
  });

  it('maps findings into incidents', () => {
    mockFindings.push(makeFinding());

    const { result } = renderHook(() => useIncidentFeed({ sources: ['finding'] }));

    expect(result.current.incidents).toHaveLength(1);
    expect(result.current.incidents[0].source).toBe('finding');
    expect(result.current.incidents[0].title).toBe('Pod CrashLoopBackOff');
    expect(result.current.incidents[0].severity).toBe('warning');
  });

  it('maps unresolved errors into incidents and excludes resolved ones', () => {
    mockErrors.push(makeError({ id: 'e-1', resolved: false }));
    mockErrors.push(makeError({ id: 'e-2', resolved: true }));

    const { result } = renderHook(() => useIncidentFeed({ sources: ['error'] }));

    expect(result.current.incidents).toHaveLength(1);
    expect(result.current.incidents[0].source).toBe('error');
    expect(result.current.incidents[0].id).toBe('error:e-1');
  });

  it('maps Prometheus alerts into incidents', () => {
    mockAlertGroups = [
      makeAlertGroup([{ name: 'HighCPU', severity: 'critical', labels: { namespace: 'prod' } }]),
    ];

    const { result } = renderHook(() => useIncidentFeed({ sources: ['alert'] }));

    expect(result.current.incidents).toHaveLength(1);
    expect(result.current.incidents[0].source).toBe('alert');
    expect(result.current.incidents[0].title).toBe('HighCPU');
    expect(result.current.incidents[0].severity).toBe('critical');
  });

  it('maps timeline entries into incidents', () => {
    mockTimelineEntries.push(makeTimelineEntry());

    const { result } = renderHook(() => useIncidentFeed({ sources: ['timeline'] }));

    expect(result.current.incidents).toHaveLength(1);
    expect(result.current.incidents[0].source).toBe('timeline');
    expect(result.current.incidents[0].title).toBe('Pod restarted');
  });

  it('merges incidents from all sources', () => {
    mockFindings.push(makeFinding({ id: 'f-1' }));
    mockErrors.push(makeError({ id: 'e-1', resourceKind: undefined, resourceName: undefined }));
    mockAlertGroups = [
      makeAlertGroup([{ name: 'TestAlert', labels: { pod: 'unique-pod', namespace: 'ns' } }]),
    ];
    mockTimelineEntries.push(makeTimelineEntry({ id: 'tl-1', correlationKey: 'unique-key' }));

    const { result } = renderHook(() => useIncidentFeed());

    // Each has a unique correlationKey so no deduplication
    expect(result.current.incidents.length).toBeGreaterThanOrEqual(4);
  });

  it('deduplicates by correlationKey, keeping highest severity', () => {
    // Two findings pointing to the same resource with different severities
    mockFindings.push(
      makeFinding({
        id: 'f-1',
        severity: 'info',
        resources: [{ kind: 'Pod', name: 'api-server', namespace: 'production' }],
        timestamp: 1000,
      }),
      makeFinding({
        id: 'f-2',
        severity: 'critical',
        resources: [{ kind: 'Pod', name: 'api-server', namespace: 'production' }],
        timestamp: 2000,
      }),
    );

    const { result } = renderHook(() => useIncidentFeed({ sources: ['finding'] }));

    // Same correlationKey = Pod/api-server/production, so deduplicated to 1
    expect(result.current.incidents).toHaveLength(1);
    expect(result.current.incidents[0].severity).toBe('critical');
  });

  it('sorts by severity (critical first) then timestamp (newest first)', () => {
    mockFindings.push(
      makeFinding({ id: 'f-1', severity: 'info', timestamp: 3000,
        resources: [{ kind: 'Pod', name: 'p1', namespace: 'ns' }] }),
      makeFinding({ id: 'f-2', severity: 'critical', timestamp: 1000,
        resources: [{ kind: 'Pod', name: 'p2', namespace: 'ns' }] }),
      makeFinding({ id: 'f-3', severity: 'warning', timestamp: 5000,
        resources: [{ kind: 'Pod', name: 'p3', namespace: 'ns' }] }),
      makeFinding({ id: 'f-4', severity: 'critical', timestamp: 4000,
        resources: [{ kind: 'Pod', name: 'p4', namespace: 'ns' }] }),
    );

    const { result } = renderHook(() => useIncidentFeed({ sources: ['finding'] }));

    const severities = result.current.incidents.map((i) => i.severity);
    const timestamps = result.current.incidents.map((i) => i.timestamp);

    // Critical items first
    expect(severities[0]).toBe('critical');
    expect(severities[1]).toBe('critical');
    expect(severities[2]).toBe('warning');
    expect(severities[3]).toBe('info');

    // Within critical, newest first
    expect(timestamps[0]).toBeGreaterThan(timestamps[1]);
  });

  it('filters by severity option', () => {
    mockFindings.push(
      makeFinding({ id: 'f-1', severity: 'critical',
        resources: [{ kind: 'Pod', name: 'p1', namespace: 'ns' }] }),
      makeFinding({ id: 'f-2', severity: 'warning',
        resources: [{ kind: 'Pod', name: 'p2', namespace: 'ns' }] }),
    );

    const { result } = renderHook(() =>
      useIncidentFeed({ sources: ['finding'], severity: 'warning' }),
    );

    expect(result.current.incidents).toHaveLength(1);
    expect(result.current.incidents[0].severity).toBe('warning');
  });

  it('respects the limit option', () => {
    mockFindings.push(
      makeFinding({ id: 'f-1', resources: [{ kind: 'Pod', name: 'p1' }] }),
      makeFinding({ id: 'f-2', resources: [{ kind: 'Pod', name: 'p2' }] }),
      makeFinding({ id: 'f-3', resources: [{ kind: 'Pod', name: 'p3' }] }),
    );

    const { result } = renderHook(() =>
      useIncidentFeed({ sources: ['finding'], limit: 2 }),
    );

    expect(result.current.incidents).toHaveLength(2);
    // Counts reflect total before limiting
    expect(result.current.counts.total).toBe(3);
  });

  it('computes counts correctly', () => {
    mockFindings.push(
      makeFinding({ id: 'f-1', severity: 'critical',
        resources: [{ kind: 'Pod', name: 'p1' }] }),
      makeFinding({ id: 'f-2', severity: 'critical',
        resources: [{ kind: 'Pod', name: 'p2' }] }),
      makeFinding({ id: 'f-3', severity: 'warning',
        resources: [{ kind: 'Pod', name: 'p3' }] }),
      makeFinding({ id: 'f-4', severity: 'info',
        resources: [{ kind: 'Pod', name: 'p4' }] }),
    );

    const { result } = renderHook(() => useIncidentFeed({ sources: ['finding'] }));

    expect(result.current.counts).toEqual({
      critical: 2,
      warning: 1,
      info: 1,
      total: 4,
    });
  });

  it('respects sources filter — only includes specified sources', () => {
    mockFindings.push(makeFinding({ id: 'f-1' }));
    mockErrors.push(makeError({ id: 'e-1' }));

    const { result } = renderHook(() =>
      useIncidentFeed({ sources: ['finding'] }),
    );

    expect(result.current.incidents.every((i) => i.source === 'finding')).toBe(true);
  });
});
