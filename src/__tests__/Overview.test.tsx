// @vitest-environment jsdom
// This file is now covered by SmartDashboard.test.tsx
// Keeping as a minimal smoke test for backwards compatibility
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Overview from '../pages/home/Overview';

const storeState: Record<string, unknown> = {
  nodes: [{ name: 'n1', status: 'Ready', cpu: 50, memory: 50, role: 'worker', version: 'v1' }],
  pods: [{ name: 'p1', namespace: 'default', status: 'Running', restarts: 0 }],
  events: [],
  metrics: [{ timestamp: new Date().toISOString(), cpu: 50, memory: 50, pods: 1 }],
  clusterInfo: { version: 'v4.14', kubernetesVersion: 'v1.28', platform: 'AWS', region: '', consoleURL: '', apiURL: '', updateChannel: 'stable' },
  fetchClusterData: vi.fn(),
  startPolling: vi.fn(),
  stopPolling: vi.fn(),
  selectedNamespace: 'all',
  namespaces: [],
  deployments: [],
  services: [],
  setSelectedNamespace: vi.fn(),
};

vi.mock('@/store/useClusterStore', () => ({
  useClusterStore: (selector?: (s: Record<string, unknown>) => unknown) =>
    selector ? selector(storeState) : storeState,
}));

vi.mock('@/store/useUIStore', () => ({
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ addToast: vi.fn(), sidebarCollapsed: false }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

describe('Overview page - smoke test', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { alerts: [] } }),
    });
  });

  afterEach(() => { cleanup(); });

  it('renders the Dashboard heading', () => {
    render(<MemoryRouter><Overview /></MemoryRouter>);
    expect(screen.getByText('Dashboard')).toBeDefined();
  });
});
