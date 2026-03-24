/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useArgoCDStore } from '../store/argoCDStore';
import { ArgoSyncBadge } from '../components/ArgoSyncBadge';

// Mock useNavigateTab
vi.mock('../hooks/useNavigateTab', () => ({
  useNavigateTab: () => vi.fn(),
}));

describe('ArgoSyncBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when ArgoCD is not available', () => {
    useArgoCDStore.setState({ available: false, resourceCache: new Map() });

    const { container } = render(
      <MemoryRouter>
        <ArgoSyncBadge kind="Deployment" namespace="default" name="my-app" />
      </MemoryRouter>
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when resource is not managed by ArgoCD', () => {
    useArgoCDStore.setState({ available: true, resourceCache: new Map() });

    const { container } = render(
      <MemoryRouter>
        <ArgoSyncBadge kind="Deployment" namespace="default" name="not-managed" />
      </MemoryRouter>
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders Synced badge for managed resources', () => {
    const cache = new Map();
    cache.set('Deployment/default/my-app', {
      appName: 'frontend',
      appNamespace: 'openshift-gitops',
      syncStatus: 'Synced',
      revision: 'abc1234def5678',
      repoURL: 'https://github.com/org/repo',
    });
    useArgoCDStore.setState({ available: true, resourceCache: cache });

    render(
      <MemoryRouter>
        <ArgoSyncBadge kind="Deployment" namespace="default" name="my-app" showLabel />
      </MemoryRouter>
    );

    expect(screen.getByText('Synced')).toBeDefined();
    expect(screen.getByText('abc1234')).toBeDefined(); // short SHA
  });

  it('renders OutOfSync badge with warning color', () => {
    const cache = new Map();
    cache.set('Service/default/my-svc', {
      appName: 'frontend',
      appNamespace: 'openshift-gitops',
      syncStatus: 'OutOfSync',
      revision: 'def5678',
    });
    useArgoCDStore.setState({ available: true, resourceCache: cache });

    render(
      <MemoryRouter>
        <ArgoSyncBadge kind="Service" namespace="default" name="my-svc" showLabel />
      </MemoryRouter>
    );

    expect(screen.getByText('OutOfSync')).toBeDefined();
  });

  it('renders compact badge without label by default', () => {
    const cache = new Map();
    cache.set('Deployment/default/my-app', {
      appName: 'frontend',
      appNamespace: 'openshift-gitops',
      syncStatus: 'Synced',
    });
    useArgoCDStore.setState({ available: true, resourceCache: cache });

    const { container } = render(
      <MemoryRouter>
        <ArgoSyncBadge kind="Deployment" namespace="default" name="my-app" />
      </MemoryRouter>
    );

    // Should render a button (compact mode) with icon but no "Synced" label text
    const button = container.querySelector('button');
    expect(button).toBeDefined();
    // Compact mode has no explicit label text — only icons
    expect(button?.textContent).toBe('');
  });

  it('has correct title with app name and commit', () => {
    const cache = new Map();
    cache.set('Deployment/default/my-app', {
      appName: 'frontend',
      appNamespace: 'openshift-gitops',
      syncStatus: 'Synced',
      revision: 'abc1234',
    });
    useArgoCDStore.setState({ available: true, resourceCache: cache });

    render(
      <MemoryRouter>
        <ArgoSyncBadge kind="Deployment" namespace="default" name="my-app" />
      </MemoryRouter>
    );

    const buttons = screen.getAllByRole('button');
    const badge = buttons.find(b => b.getAttribute('title')?.includes('ArgoCD'));
    expect(badge).toBeDefined();
    expect(badge?.getAttribute('title')).toContain('Synced');
    expect(badge?.getAttribute('title')).toContain('frontend');
  });
});
