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
    investigations: [],
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

import { InvestigateTab } from '../InvestigateTab';

function renderInvestigateTab() {
  return render(
    <MemoryRouter>
      <InvestigateTab />
    </MemoryRouter>
  );
}

describe('InvestigateTab', () => {
  it('renders without crashing', () => {
    renderInvestigateTab();
  });

  it('shows time range buttons', () => {
    renderInvestigateTab();
    expect(screen.getAllByText('24h').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1h').length).toBeGreaterThan(0);
  });

  it('renders category filter buttons', () => {
    renderInvestigateTab();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });
});
