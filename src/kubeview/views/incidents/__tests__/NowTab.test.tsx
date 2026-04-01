// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../../store/uiStore', () => ({
  useUIStore: (sel: any) => sel({
    selectedNamespace: '*',
    addToast: vi.fn(),
    addTab: vi.fn(),
  }),
}));

vi.mock('../../../store/monitorStore', () => ({
  useMonitorStore: (sel: any) => sel({
    findings: [],
    resolutions: [],
    dismissFinding: vi.fn(),
  }),
}));

vi.mock('../../../store/agentStore', () => ({
  useAgentStore: (sel: any) => sel({
    isConnected: false,
    sendMessage: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useIncidentFeed', () => ({
  useIncidentFeed: () => ({
    incidents: [],
    counts: { critical: 0, warning: 0, info: 0, total: 0 },
    isLoading: false,
  }),
}));

vi.mock('../../../hooks/useNavigateTab', () => ({
  useNavigateTab: () => vi.fn(),
}));

vi.mock('../../../engine/formatters', () => ({
  formatRelativeTime: () => '5m ago',
}));

vi.mock('../../../engine/errorToast', () => ({
  showErrorToast: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

import { NowTab } from '../NowTab';

function renderNowTab() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NowTab />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('NowTab', () => {
  it('renders without crashing', () => {
    renderNowTab();
  });

  it('shows empty state when no incidents', () => {
    renderNowTab();
    expect(screen.getAllByText(/no active incidents/i).length).toBeGreaterThan(0);
  });
});
