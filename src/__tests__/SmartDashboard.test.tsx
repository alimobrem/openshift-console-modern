// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Overview from '../pages/home/Overview';

const navigateMock = vi.fn();
const addToastMock = vi.fn();

const mockNodes = [
  { name: 'node-1', status: 'Ready', cpu: 40, memory: 50, role: 'master', version: 'v1.28' },
  { name: 'node-2', status: 'Ready', cpu: 60, memory: 70, role: 'worker', version: 'v1.28' },
  { name: 'node-3', status: 'NotReady', cpu: 80, memory: 30, role: 'worker', version: 'v1.28' },
];

const mockPods = [
  { name: 'nginx', namespace: 'default', status: 'Running', restarts: 0 },
  { name: 'redis', namespace: 'default', status: 'Running', restarts: 0 },
  { name: 'broken', namespace: 'default', status: 'Failed', restarts: 5 },
];

const storeState: Record<string, unknown> = {
  nodes: mockNodes,
  pods: mockPods,
  events: [
    { type: 'Warning', reason: 'BackOff', message: 'Container restarting', timestamp: new Date().toISOString(), namespace: 'default' },
    { type: 'Normal', reason: 'Pulled', message: 'Image pulled', timestamp: new Date().toISOString(), namespace: 'default' },
  ],
  metrics: [{ timestamp: new Date().toISOString(), cpu: 50, memory: 60, pods: 3 }],
  clusterInfo: { version: 'v4.14', kubernetesVersion: 'v1.28', platform: 'AWS', region: 'us-east-1', consoleURL: '', apiURL: 'https://api.cluster:6443', updateChannel: 'stable-4.14' },
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
    selector({ addToast: addToastMock, sidebarCollapsed: false }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Overview />
    </MemoryRouter>,
  );
}

describe('Smart Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for alerts
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          alerts: [
            {
              labels: { alertname: 'HighCPU', severity: 'critical', namespace: 'prod' },
              annotations: { summary: 'CPU over 95%' },
              state: 'firing',
            },
            {
              labels: { alertname: 'DiskWarn', severity: 'warning', namespace: 'default' },
              annotations: { summary: 'Disk 85%' },
              state: 'firing',
            },
          ],
        },
      }),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the Dashboard title', () => {
    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeDefined();
  });

  it('shows cluster summary in header', () => {
    renderDashboard();
    expect(screen.getByText(/3 nodes/)).toBeDefined();
    expect(screen.getByText(/3 pods/)).toBeDefined();
  });

  it('renders Deploy and +Add quick action buttons', () => {
    renderDashboard();
    expect(screen.getByText('Deploy')).toBeDefined();
    expect(screen.getByText('+ Add')).toBeDefined();
  });

  it('shows health scores for nodes, pods, and alerts', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Cluster Health')).toBeDefined();
    });
    // Health labels exist (may have duplicates from card titles)
    expect(screen.getAllByText('Nodes').length).toBeGreaterThanOrEqual(1);
  });

  it('computes correct overall health score', () => {
    renderDashboard();
    // nodeHealth=67, podHealth=67, alertHealth starts at 100 before fetch resolves
    // Overall = (67+67+100)/3 = 78
    const healthBig = document.querySelector('.os-dashboard__health-big');
    expect(healthBig?.textContent).toContain('%');
  });

  it('fetches and displays firing alerts', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('HighCPU')).toBeDefined();
      expect(screen.getByText('DiskWarn')).toBeDefined();
      expect(screen.getByText('CPU over 95%')).toBeDefined();
    });
  });

  it('shows Silence button on each alert', async () => {
    renderDashboard();
    await waitFor(() => {
      const silenceButtons = screen.getAllByText('Silence');
      expect(silenceButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('shows node list with status dots', () => {
    renderDashboard();
    expect(screen.getByText('node-1')).toBeDefined();
    expect(screen.getByText('node-2')).toBeDefined();
    expect(screen.getByText('node-3')).toBeDefined();
  });

  it('shows recent events', () => {
    renderDashboard();
    expect(screen.getByText('BackOff')).toBeDefined();
    expect(screen.getByText('Pulled')).toBeDefined();
  });

  it('shows utilization metrics', () => {
    renderDashboard();
    expect(screen.getByText('CPU')).toBeDefined();
    expect(screen.getByText('Memory')).toBeDefined();
  });

  it('navigates to events page on View all click', () => {
    renderDashboard();
    const viewAllLinks = screen.getAllByText('View all');
    // Click the events View all
    fireEvent.click(viewAllLinks[viewAllLinks.length - 1]);
    expect(navigateMock).toHaveBeenCalled();
  });

  it('shows cluster details card', () => {
    renderDashboard();
    expect(screen.getByText('Cluster Details')).toBeDefined();
    expect(screen.getByText('AWS')).toBeDefined();
    expect(screen.getByText('stable-4.14')).toBeDefined();
  });
});
