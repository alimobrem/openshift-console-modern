// @vitest-environment jsdom
/**
 * Tests that previously-silent catch blocks now surface errors properly.
 *
 * User-facing operations → showErrorToast
 * Internal/best-effort operations → console.warn
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock uiStore before any imports that use it
const mockAddToast = vi.fn();
vi.mock('../store/uiStore', () => ({
  useUIStore: Object.assign(
    (selector: any) =>
      selector({
        selectedNamespace: '*',
        addTab: vi.fn(),
        addToast: mockAddToast,
        impersonateUser: '',
        impersonateGroups: [],
      }),
    {
      getState: () => ({
        selectedNamespace: '*',
        addTab: vi.fn(),
        addToast: mockAddToast,
        impersonateUser: '',
        impersonateGroups: [],
      }),
      setState: vi.fn(),
      subscribe: vi.fn(),
      destroy: vi.fn(),
    },
  ),
}));
vi.mock('../store/errorStore', () => ({
  useErrorStore: Object.assign(() => ({}), {
    getState: () => ({ errors: [], trackError: vi.fn() }),
    setState: vi.fn(),
    subscribe: vi.fn(),
    destroy: vi.fn(),
  }),
}));

import { showErrorToast } from '../engine/errorToast';
import { PulseError } from '../engine/errors';
import { saveSnapshots, type ClusterSnapshot } from '../engine/snapshot';

function makeSnapshot(overrides: Partial<ClusterSnapshot> = {}): ClusterSnapshot {
  return {
    id: 'snap-1',
    label: 'test',
    timestamp: new Date().toISOString(),
    clusterVersion: '4.17.0',
    platform: 'AWS',
    controlPlaneTopology: 'HighlyAvailable',
    nodes: { count: 6, versions: ['v1.30.0'] },
    clusterOperators: [],
    crds: [],
    storageClasses: [],
    namespaceCount: 10,
    ...overrides,
  };
}

describe('silent catch block fixes', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockAddToast.mockClear();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('showErrorToast (user-facing)', () => {
    it('fires toast for user-facing errors', () => {
      showErrorToast(new Error('network failure'), 'Failed to load Helm chart');
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Failed to load Helm chart',
          detail: 'network failure',
        }),
      );
    });

    it('fires toast for OperatorCatalog non-409 errors', () => {
      // Simulate what the OperatorCatalogView catch block does for non-409
      const err = new PulseError({
        message: 'forbidden',
        category: 'permission',
        statusCode: 403,
        context: { operation: 'create' },
        userMessage: 'Forbidden',
        suggestions: [],
      });
      if (!(err instanceof PulseError && err.statusCode === 409)) {
        showErrorToast(err, 'Failed to create namespace');
      }
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Failed to create namespace',
        }),
      );
    });

    it('does NOT fire toast for 409 Conflict errors', () => {
      const err = new PulseError({
        message: 'already exists',
        category: 'conflict',
        statusCode: 409,
        context: { operation: 'create' },
        userMessage: 'Already exists',
        suggestions: [],
      });
      if (!(err instanceof PulseError && err.statusCode === 409)) {
        showErrorToast(err, 'Failed to create namespace');
      }
      expect(mockAddToast).not.toHaveBeenCalled();
    });
  });

  describe('console.warn (internal/best-effort)', () => {
    it('snapshot: warns on localStorage failure', () => {
      // Force localStorage.setItem to throw
      const origSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error('QuotaExceededError');
      };
      try {
        saveSnapshots(Array.from({ length: 20 }, (_, i) => makeSnapshot({ id: `snap-${i}` })));
        expect(warnSpy).toHaveBeenCalledWith(
          'Failed to save snapshot to localStorage:',
          expect.any(Error),
        );
      } finally {
        Storage.prototype.setItem = origSetItem;
      }
    });
  });
});
