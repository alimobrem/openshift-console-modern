// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../../store/uiStore', () => ({
  useUIStore: (sel: any) => sel({
    selectedNamespace: '*',
    addTab: vi.fn(),
  }),
}));

vi.mock('../../../store/monitorStore', () => ({
  useMonitorStore: (sel: any) => sel({
    fixHistory: [],
  }),
}));

vi.mock('../../../hooks/useIncidentTimeline', () => ({
  useIncidentTimeline: () => ({ entries: [], correlationGroups: [], isLoading: false }),
}));

vi.mock('../../../hooks/useNavigateTab', () => ({
  useNavigateTab: () => vi.fn(),
}));

vi.mock('../../../engine/gvr', () => ({
  resourceDetailUrl: () => '/r/v1~pods/default/test',
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

import { HistoryTab } from '../HistoryTab';

function renderHistoryTab() {
  return render(
    <MemoryRouter>
      <HistoryTab />
    </MemoryRouter>
  );
}

describe('HistoryTab', () => {
  it('renders without crashing', () => {
    renderHistoryTab();
  });

  it('shows time range buttons', () => {
    renderHistoryTab();
    expect(screen.getAllByText('24h').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1h').length).toBeGreaterThan(0);
  });

  it('renders category filter buttons', () => {
    renderHistoryTab();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });
});
