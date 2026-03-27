// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import React from 'react';

const _mockUIState: Record<string, any> = {
  dockPanel: 'logs',
  dockWidth: 420,
  dockFullscreen: false,
  dockContext: null,
  terminalContext: null,
  setDockWidth: vi.fn(),
  toggleDockFullscreen: vi.fn(),
  openDock: vi.fn(),
  closeDock: vi.fn(),
};

vi.mock('../../store/uiStore', () => ({
  useUIStore: (selector: any) => selector(_mockUIState),
}));
vi.mock('../../store/monitorStore', () => ({
  useMonitorStore: (selector: any) => {
    const state = {
      connected: false,
      findings: [],
      unreadCount: 0,
      pendingActions: [],
      markAllRead: vi.fn(),
      dismissFinding: vi.fn(),
    };
    return selector(state);
  },
}));
vi.mock('@/lib/utils', () => ({ cn: (...args: any[]) => args.filter(Boolean).join(' ') }));

import { Dock } from '../Dock';

function renderDock() {
  return render(<Dock />);
}

describe('Dock', () => {
  afterEach(() => {
    cleanup();
    _mockUIState.dockPanel = 'logs';
    _mockUIState.terminalContext = null;
    _mockUIState.openDock.mockClear();
    _mockUIState.closeDock.mockClear();
  });

  it('renders panel toggle buttons for Logs, Terminal, Events', () => {
    renderDock();
    expect(screen.getAllByText('Logs').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Terminal').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Events').length).toBeGreaterThanOrEqual(1);
  });

  it('shows logs content when dockPanel is logs', () => {
    _mockUIState.dockPanel = 'logs';
    renderDock();
    expect(screen.getByText(/Navigate to a pod/)).toBeDefined();
  });

  it('shows terminal placeholder when dockPanel is terminal and no context', () => {
    _mockUIState.dockPanel = 'terminal';
    renderDock();
    expect(screen.getByText(/Open a terminal/)).toBeDefined();
  });

  it('shows events content when dockPanel is events', () => {
    _mockUIState.dockPanel = 'events';
    renderDock();
    expect(screen.getByText('No events')).toBeDefined();
  });

  it('calls closeDock when close button is clicked', () => {
    renderDock();
    const closeBtn = screen.getByTitle('Close');
    fireEvent.click(closeBtn);
    expect(_mockUIState.closeDock).toHaveBeenCalled();
  });
});
