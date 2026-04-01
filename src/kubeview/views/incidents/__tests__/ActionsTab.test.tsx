// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../../store/monitorStore', () => ({
  useMonitorStore: (sel: any) => sel({
    pendingActions: [],
    recentActions: [],
    approveAction: vi.fn(),
    rejectAction: vi.fn(),
  }),
}));

vi.mock('../../../engine/formatters', () => ({
  formatRelativeTime: () => '2m ago',
}));

vi.mock('../../../engine/fixHistory', () => ({
  requestRollback: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

import { ActionsTab } from '../ActionsTab';

function renderActionsTab() {
  return render(
    <MemoryRouter>
      <ActionsTab />
    </MemoryRouter>
  );
}

describe('ActionsTab', () => {
  it('renders without crashing', () => {
    renderActionsTab();
  });

  it('shows empty state when no actions', () => {
    renderActionsTab();
    expect(screen.getAllByText(/no.*action/i).length).toBeGreaterThan(0);
  });

  it('renders search input', () => {
    renderActionsTab();
    expect(screen.getAllByPlaceholderText(/search/i).length).toBeGreaterThan(0);
  });
});
