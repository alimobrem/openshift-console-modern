// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TabBar } from '../TabBar';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../../store/uiStore', () => ({
  useUIStore: Object.assign(
    (selector: any) => {
      const state = {
        tabs: [
          { id: '1', title: 'Workloads', path: '/workloads', pinned: true, closable: false },
          { id: '2', title: 'Pods', path: '/r/v1~pods', pinned: false, closable: true },
        ],
        activeTabId: '1',
        setActiveTab: vi.fn(),
        closeTab: vi.fn(),
        reorderTabs: vi.fn(),
        pinTab: vi.fn(),
        unpinTab: vi.fn(),
        openCommandPalette: vi.fn(),
        addTab: vi.fn(),
        _pendingNavigate: null,
      };
      return selector(state);
    },
    { setState: vi.fn(), getState: vi.fn() },
  ),
}));

describe('TabBar rendering', () => {
  it('renders a tablist container with role="tablist"', () => {
    render(
      <MemoryRouter>
        <TabBar />
      </MemoryRouter>,
    );
    expect(screen.getByRole('tablist')).toBeTruthy();
  });

  it('renders tabs with aria-selected reflecting active state', () => {
    render(
      <MemoryRouter>
        <TabBar />
      </MemoryRouter>,
    );
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
    // First tab is active
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    // Second tab is not active
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
  });

  it('close buttons have aria-label', () => {
    render(
      <MemoryRouter>
        <TabBar />
      </MemoryRouter>,
    );
    const closeBtns = screen.getAllByLabelText('Close tab');
    expect(closeBtns.length).toBeGreaterThan(0);
  });

  it('pin buttons have aria-label', () => {
    render(
      <MemoryRouter>
        <TabBar />
      </MemoryRouter>,
    );
    const pinBtns = screen.getAllByLabelText('Pin tab');
    expect(pinBtns.length).toBeGreaterThan(0);
  });
});
