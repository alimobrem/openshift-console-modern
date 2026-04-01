import { describe, it, expect, vi } from 'vitest';

vi.mock('../renderers/index', () => ({
  kindToPlural: (kind: string) => {
    const map: Record<string, string> = {
      Pod: 'pods',
      Deployment: 'deployments',
      Service: 'services',
      Namespace: 'namespaces',
      Node: 'nodes',
      ClusterRole: 'clusterroles',
    };
    return map[kind] || kind.toLowerCase() + 's';
  },
}));

vi.mock('../clusterConnection', () => ({
  getClusterBase: () => '/api/kubernetes',
}));

import { gvrToUrl, urlToGvr, resourceDetailUrl, K8S_BASE } from '../gvr';

describe('gvrToUrl', () => {
  it('converts core resource GVR key to URL segment', () => {
    expect(gvrToUrl('v1/pods')).toBe('v1~pods');
  });

  it('converts group resource GVR key to URL segment', () => {
    expect(gvrToUrl('apps/v1/deployments')).toBe('apps~v1~deployments');
  });

  it('handles multiple slashes', () => {
    expect(gvrToUrl('rbac.authorization.k8s.io/v1/clusterroles')).toBe('rbac.authorization.k8s.io~v1~clusterroles');
  });

  it('returns unchanged string with no slashes', () => {
    expect(gvrToUrl('pods')).toBe('pods');
  });
});

describe('urlToGvr', () => {
  it('converts URL segment back to GVR key', () => {
    expect(urlToGvr('apps~v1~deployments')).toBe('apps/v1/deployments');
  });

  it('converts core resource URL back', () => {
    expect(urlToGvr('v1~pods')).toBe('v1/pods');
  });

  it('is the inverse of gvrToUrl', () => {
    const key = 'apps/v1/deployments';
    expect(urlToGvr(gvrToUrl(key))).toBe(key);
  });
});

describe('resourceDetailUrl', () => {
  it('builds URL for namespaced resource with group', () => {
    const resource = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'nginx', namespace: 'default' },
    };
    expect(resourceDetailUrl(resource)).toBe('/r/apps~v1~deployments/default/nginx');
  });

  it('builds URL for namespaced core resource', () => {
    const resource = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'my-pod', namespace: 'kube-system' },
    };
    expect(resourceDetailUrl(resource)).toBe('/r/v1~pods/kube-system/my-pod');
  });

  it('builds URL for cluster-scoped resource', () => {
    const resource = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'ClusterRole',
      metadata: { name: 'admin' },
    };
    expect(resourceDetailUrl(resource)).toBe('/r/rbac.authorization.k8s.io~v1~clusterroles/_/admin');
  });

  it('handles missing namespace with underscore placeholder', () => {
    const resource = {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: { name: 'default' },
    };
    expect(resourceDetailUrl(resource)).toBe('/r/v1~namespaces/_/default');
  });
});

describe('K8S_BASE', () => {
  it('is the correct base path', () => {
    expect(K8S_BASE).toBe('/api/kubernetes');
  });
});
