import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useClusterStore } from '../clusterStore';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function resetStore() {
  useClusterStore.setState({
    resourceRegistry: null,
    apiGroups: [],
    discoveryLoading: false,
    discoveryError: null,
    clusterVersion: null,
    kubernetesVersion: null,
    platform: null,
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  resetStore();
});

describe('clusterStore', () => {
  describe('initial state', () => {
    it('starts with null registry', () => {
      expect(useClusterStore.getState().resourceRegistry).toBeNull();
    });

    it('starts with empty apiGroups', () => {
      expect(useClusterStore.getState().apiGroups).toEqual([]);
    });

    it('starts not loading', () => {
      expect(useClusterStore.getState().discoveryLoading).toBe(false);
    });
  });

  describe('runDiscovery', () => {
    it('sets loading state during discovery', async () => {
      // Mock /apis to return empty groups
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ groups: [] }),
      });
      // Mock /api/v1 to return empty resources
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ resources: [] }),
      });

      const promise = useClusterStore.getState().runDiscovery();
      expect(useClusterStore.getState().discoveryLoading).toBe(true);

      await promise;
      expect(useClusterStore.getState().discoveryLoading).toBe(false);
    });

    it('populates registry from core API', async () => {
      // Mock /apis
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ groups: [] }),
      });
      // Mock /api/v1
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          resources: [
            { name: 'pods', singularName: 'pod', namespaced: true, kind: 'Pod', verbs: ['get', 'list'] },
            { name: 'nodes', singularName: 'node', namespaced: false, kind: 'Node', verbs: ['get', 'list'] },
            { name: 'pods/log', singularName: '', namespaced: true, kind: 'Pod', verbs: ['get'] },
          ],
        }),
      });

      await useClusterStore.getState().runDiscovery();

      const registry = useClusterStore.getState().resourceRegistry;
      expect(registry).not.toBeNull();
      expect(registry!.has('v1/pods')).toBe(true);
      expect(registry!.has('v1/nodes')).toBe(true);
      // Subresources should be skipped
      expect(registry!.has('v1/pods/log')).toBe(false);
    });

    it('populates registry from API groups', async () => {
      // Mock /apis
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          groups: [{
            name: 'apps',
            preferredVersion: { version: 'v1' },
            versions: [{ version: 'v1', groupVersion: 'apps/v1' }],
          }],
        }),
      });
      // Mock /apis/apps/v1
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          resources: [
            { name: 'deployments', singularName: 'deployment', namespaced: true, kind: 'Deployment', verbs: ['get', 'list', 'create'] },
          ],
        }),
      });
      // Mock /api/v1
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ resources: [] }),
      });

      await useClusterStore.getState().runDiscovery();

      const registry = useClusterStore.getState().resourceRegistry;
      expect(registry!.has('apps/v1/deployments')).toBe(true);
      expect(registry!.get('apps/v1/deployments')?.kind).toBe('Deployment');
    });

    it('sets error on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await useClusterStore.getState().runDiscovery();

      expect(useClusterStore.getState().discoveryError).toBeTruthy();
      expect(useClusterStore.getState().discoveryLoading).toBe(false);
    });
  });

  describe('setClusterInfo', () => {
    it('sets cluster version', () => {
      useClusterStore.getState().setClusterInfo({ version: '4.17' });
      expect(useClusterStore.getState().clusterVersion).toBe('4.17');
    });

    it('sets kubernetes version', () => {
      useClusterStore.getState().setClusterInfo({ kubernetesVersion: '1.30' });
      expect(useClusterStore.getState().kubernetesVersion).toBe('1.30');
    });

    it('sets platform', () => {
      useClusterStore.getState().setClusterInfo({ platform: 'AWS' });
      expect(useClusterStore.getState().platform).toBe('AWS');
    });

    it('preserves existing values when partial update', () => {
      useClusterStore.getState().setClusterInfo({ version: '4.17', platform: 'AWS' });
      useClusterStore.getState().setClusterInfo({ kubernetesVersion: '1.30' });

      const state = useClusterStore.getState();
      expect(state.clusterVersion).toBe('4.17');
      expect(state.kubernetesVersion).toBe('1.30');
      expect(state.platform).toBe('AWS');
    });
  });
});
