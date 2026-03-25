import { describe, it, expect } from 'vitest';
import { generateSmartPrompts } from '../smartPrompts';

describe('generateSmartPrompts', () => {
  it('returns generic prompts when no cluster issues', () => {
    const prompts = generateSmartPrompts({});
    expect(prompts.length).toBeGreaterThanOrEqual(3);
    expect(prompts[0].text).toBe('Check overall cluster health');
  });

  it('generates diagnosis prompt for failed pods', () => {
    const prompts = generateSmartPrompts({
      failedPods: [{ name: 'api-pod', namespace: 'prod', status: 'CrashLoopBackOff' }],
    });
    const first = prompts[0];
    expect(first.text).toContain('api-pod');
    expect(first.text).toContain('CrashLoopBackOff');
    expect(first.category).toBe('diagnosis');
    expect(first.priority).toBe(100);
    expect(first.context).toEqual({ kind: 'Pod', name: 'api-pod', namespace: 'prod' });
  });

  it('generates bulk prompt for multiple failed pods', () => {
    const prompts = generateSmartPrompts({
      failedPods: [
        { name: 'pod-a', namespace: 'ns1', status: 'Failed' },
        { name: 'pod-b', namespace: 'ns2', status: 'Error' },
      ],
    });
    const bulk = prompts.find((p) => p.text.includes('2 failing pods'));
    expect(bulk).toBeDefined();
    expect(bulk!.priority).toBe(95);
  });

  it('generates prompt for degraded operators', () => {
    const prompts = generateSmartPrompts({
      degradedOperators: [{ name: 'kube-scheduler' }],
    });
    const op = prompts.find((p) => p.text.includes('kube-scheduler'));
    expect(op).toBeDefined();
    expect(op!.category).toBe('diagnosis');
    expect(op!.context?.kind).toBe('ClusterOperator');
  });

  it('generates prompt for critical firing alerts', () => {
    const prompts = generateSmartPrompts({
      firingAlerts: [{ alertname: 'KubePodCrashLooping', severity: 'critical' }],
    });
    const alert = prompts.find((p) => p.text.includes('KubePodCrashLooping'));
    expect(alert).toBeDefined();
    expect(alert!.priority).toBe(85);
  });

  it('generates prompt for expiring certs', () => {
    const prompts = generateSmartPrompts({
      certsExpiringSoon: [{ name: 'tls-cert', namespace: 'default', daysUntilExpiry: 3 }],
    });
    const cert = prompts.find((p) => p.text.includes('tls-cert'));
    expect(cert).toBeDefined();
    expect(cert!.category).toBe('security');
  });

  it('generates resource-specific prompts for detail pages', () => {
    const prompts = generateSmartPrompts({
      resourceKind: 'Deployment',
      resourceName: 'api-gateway',
      resourceNamespace: 'prod',
    });
    const change = prompts.find((p) => p.text.includes('changed recently'));
    expect(change).toBeDefined();
    expect(change!.context?.kind).toBe('Deployment');
  });

  it('generates view-specific prompts for workloads view', () => {
    const prompts = generateSmartPrompts({ currentView: '/workloads' });
    const workload = prompts.find((p) => p.text.includes('unhealthy'));
    expect(workload).toBeDefined();
  });

  it('generates view-specific prompts for compute view', () => {
    const prompts = generateSmartPrompts({ currentView: '/compute' });
    const node = prompts.find((p) => p.text.includes('pressure'));
    expect(node).toBeDefined();
  });

  it('generates view-specific prompts for security view', () => {
    const prompts = generateSmartPrompts({ currentView: '/security' });
    const sec = prompts.find((p) => p.text.includes('security scan'));
    expect(sec).toBeDefined();
  });

  it('sorts by priority (highest first)', () => {
    const prompts = generateSmartPrompts({
      failedPods: [{ name: 'pod-a', namespace: 'ns1', status: 'Failed' }],
      degradedOperators: [{ name: 'dns' }],
    });
    for (let i = 1; i < prompts.length; i++) {
      expect(prompts[i - 1].priority).toBeGreaterThanOrEqual(prompts[i].priority);
    }
  });

  it('deduplicates prompts with same text', () => {
    const prompts = generateSmartPrompts({});
    const texts = prompts.map((p) => p.text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('includes namespace in generic prompt when selected', () => {
    const prompts = generateSmartPrompts({ selectedNamespace: 'payments' });
    const ns = prompts.find((p) => p.text.includes('payments'));
    expect(ns).toBeDefined();
  });
});
