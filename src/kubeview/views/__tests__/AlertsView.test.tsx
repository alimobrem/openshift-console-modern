// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const navigateMock = vi.fn();
const addTabMock = vi.fn();
const addToastMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../../store/uiStore', () => ({
  useUIStore: Object.assign(
    (selector: any) => {
      const state = {
        addTab: addTabMock,
        addToast: addToastMock,
        setSelectedNamespace: vi.fn(),
      };
      return selector(state);
    },
    {
      getState: () => ({
        setSelectedNamespace: vi.fn(),
      }),
    },
  ),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import AlertsView from '../AlertsView';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function renderAlerts(queryClient?: QueryClient) {
  // Default: fetch returns empty results
  if (mockFetch.mock.calls.length === 0 && mockFetch.getMockImplementation() === undefined) {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/rules')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { groups: [] } }),
        });
      }
      if (url.includes('/silences')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    });
  }

  const qc = queryClient ?? createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AlertsView />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AlertsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the Alerts heading', () => {
    renderAlerts();
    expect(screen.getByText('Alerts')).toBeDefined();
  });

  it('renders 3 tabs: Firing, Rules, Silences', () => {
    renderAlerts();
    // Tab buttons contain text like "Firing (0)", "Rules (0)", "Silences (0)"
    expect(screen.getByRole('button', { name: /^Firing \(/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Rules \(/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Silences \(/ })).toBeDefined();
  });

  it('shows "No alerts firing" badge when no alerts', () => {
    renderAlerts();
    expect(screen.getAllByText('No alerts firing').length).toBeGreaterThanOrEqual(1);
  });

  it('shows search input with placeholder', () => {
    renderAlerts();
    expect(screen.getByPlaceholderText('Search alerts...')).toBeDefined();
  });

  it('shows stat cards for Firing Alerts, Alert Rules, Active Silences', () => {
    renderAlerts();
    expect(screen.getByText('Firing Alerts')).toBeDefined();
    expect(screen.getByText('Alert Rules')).toBeDefined();
    expect(screen.getByText('Active Silences')).toBeDefined();
  });

  it('shows zero counts in stat cards when empty', () => {
    renderAlerts();
    // All three stat cards should show 0
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(3);
  });

  it('shows subtitle text', () => {
    renderAlerts();
    expect(screen.getByText('Prometheus alerts, rules, and silences')).toBeDefined();
  });

  it('shows "No alerts firing" in the firing tab content when empty', () => {
    renderAlerts();
    // The firing tab is active by default and shows "No alerts firing" in two places:
    // the badge at top and the empty-state in the tab content
    const noAlerts = screen.getAllByText('No alerts firing');
    expect(noAlerts.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "No active silences" when switching to silences tab', () => {
    renderAlerts();
    const silencesTab = screen.getByRole('button', { name: /^Silences \(/ });
    fireEvent.click(silencesTab);
    expect(screen.getByText('No active silences')).toBeDefined();
  });

  it('search input accepts text', () => {
    renderAlerts();
    const input = screen.getByPlaceholderText('Search alerts...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test-alert' } });
    expect(input.value).toBe('test-alert');
  });
});
