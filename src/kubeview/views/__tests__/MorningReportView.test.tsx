// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock('../../store/uiStore', () => ({
  useUIStore: (selector: any) => selector({ selectedNamespace: '*', addTab: vi.fn(), addToast: vi.fn() }),
}));
const mockData: Record<string, any[]> = {};
vi.mock('../../hooks/useK8sListWatch', () => ({
  useK8sListWatch: ({ apiPath }: { apiPath: string }) => ({ data: mockData[apiPath] || [], isLoading: false }),
}));
vi.mock('../../hooks/useNavigateTab', () => ({ useNavigateTab: () => vi.fn() }));
vi.mock('../../engine/query', () => ({ k8sList: vi.fn().mockResolvedValue([]), k8sGet: vi.fn().mockResolvedValue(null) }));
vi.mock('../../components/metrics/prometheus', () => ({ queryInstant: vi.fn().mockResolvedValue([]) }));
vi.mock('@/lib/utils', () => ({ cn: (...args: any[]) => args.filter(Boolean).join(' ') }));

import MorningReportView from '../MorningReportView';

function renderView() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <MorningReportView />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MorningReportView', () => {
  afterEach(() => {
    cleanup();
    Object.keys(mockData).forEach((k) => delete mockData[k]);
  });

  it('renders page header with title', () => {
    renderView();
    expect(screen.getByText('Morning Report')).toBeTruthy();
  });

  it('renders the Cluster Risk Score panel', () => {
    renderView();
    expect(screen.getByText('Cluster Risk Score')).toBeTruthy();
  });

  it('renders the Needs Attention panel', () => {
    renderView();
    expect(screen.getByText('Needs Attention')).toBeTruthy();
  });

  it('shows all-clear when no issues', () => {
    renderView();
    expect(screen.getByText(/All clear/)).toBeTruthy();
  });

  it('renders Cluster Vitals section with 4 cards', () => {
    renderView();
    expect(screen.getByText('CPU Usage')).toBeTruthy();
    expect(screen.getByText('Memory Usage')).toBeTruthy();
    expect(screen.getByText('Node Health')).toBeTruthy();
    expect(screen.getByText('Pod Health')).toBeTruthy();
  });

  it('renders Since Yesterday panel', () => {
    renderView();
    expect(screen.getByText('Since Yesterday')).toBeTruthy();
    expect(screen.getByText('New alerts fired')).toBeTruthy();
    expect(screen.getByText(/Pods restarted/)).toBeTruthy();
    expect(screen.getByText('Deployments scaled')).toBeTruthy();
    expect(screen.getByText('RBAC changes')).toBeTruthy();
  });

  it('renders Certificate Expiry panel', () => {
    renderView();
    expect(screen.getByText('Certificate Expiry')).toBeTruthy();
  });

  it('shows risk score of 0 with no data', () => {
    renderView();
    // Score appears in SVG and in change summary counts — use getAllByText
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Healthy')).toBeTruthy();
  });

  it('renders node health as 0 / 0 with no nodes', () => {
    renderView();
    expect(screen.getAllByText('0 / 0').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Refresh button', () => {
    renderView();
    expect(screen.getByText('Refresh')).toBeTruthy();
  });

  it('shows unhealthy node in attention items', () => {
    mockData['/api/v1/nodes'] = [{
      metadata: { name: 'bad-node', uid: 'n1', labels: {}, creationTimestamp: '2025-01-01T00:00:00Z' },
      status: { conditions: [{ type: 'Ready', status: 'False' }] },
    }];
    renderView();
    expect(screen.getByText('Node bad-node is NotReady')).toBeTruthy();
  });

  it('shows ready node count correctly', () => {
    mockData['/api/v1/nodes'] = [
      {
        metadata: { name: 'ready-node', uid: 'n1', labels: {}, creationTimestamp: '2025-01-01T00:00:00Z' },
        status: { conditions: [{ type: 'Ready', status: 'True' }] },
      },
      {
        metadata: { name: 'bad-node', uid: 'n2', labels: {}, creationTimestamp: '2025-01-01T00:00:00Z' },
        status: { conditions: [{ type: 'Ready', status: 'False' }] },
      },
    ];
    renderView();
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  it('shows failed pod in attention items', () => {
    mockData['/api/v1/pods'] = [{
      metadata: { name: 'crash-pod', namespace: 'test-ns', uid: 'p1', labels: {}, creationTimestamp: '2025-01-01T00:00:00Z' },
      status: {
        phase: 'Running',
        containerStatuses: [{ state: { waiting: { reason: 'CrashLoopBackOff' } }, restartCount: 10 }],
      },
    }];
    renderView();
    expect(screen.getByText(/crash-pod/)).toBeTruthy();
    expect(screen.getByText(/CrashLoopBackOff/)).toBeTruthy();
  });

  it('computes risk score with unhealthy nodes', () => {
    mockData['/api/v1/nodes'] = [{
      metadata: { name: 'bad-node', uid: 'n1', labels: {}, creationTimestamp: '2025-01-01T00:00:00Z' },
      status: { conditions: [{ type: 'Ready', status: 'False' }] },
    }];
    renderView();
    // 1 unhealthy node = 15 points, still in "Healthy" range (0-20)
    expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Healthy')).toBeTruthy();
  });

  it('shows risk breakdown stats', () => {
    renderView();
    expect(screen.getByText(/Critical alerts: 0/)).toBeTruthy();
    expect(screen.getByText(/Warning alerts: 0/)).toBeTruthy();
    expect(screen.getByText(/Unhealthy nodes: 0/)).toBeTruthy();
    expect(screen.getByText(/Degraded operators: 0/)).toBeTruthy();
    expect(screen.getByText(/Failed pods: 0/)).toBeTruthy();
  });

  it('filters system namespace pods from user pod count', () => {
    mockData['/api/v1/pods'] = [
      {
        metadata: { name: 'user-pod', namespace: 'my-app', uid: 'p1', labels: {}, creationTimestamp: '2025-01-01T00:00:00Z' },
        status: { phase: 'Running', containerStatuses: [] },
      },
      {
        metadata: { name: 'system-pod', namespace: 'openshift-monitoring', uid: 'p2', labels: {}, creationTimestamp: '2025-01-01T00:00:00Z' },
        status: { phase: 'Running', containerStatuses: [] },
      },
    ];
    renderView();
    // Pod Health should show 1 / 1 (only user namespace pods)
    expect(screen.getByText('1 / 1')).toBeTruthy();
  });

  it('shows -- for CPU/Memory when prometheus data unavailable', () => {
    renderView();
    expect(screen.getAllByText('--').length).toBe(2);
  });

  it('displays current date in header', () => {
    renderView();
    const now = new Date();
    const dayName = now.toLocaleDateString([], { weekday: 'long' });
    expect(screen.getByText(new RegExp(dayName))).toBeTruthy();
  });
});
