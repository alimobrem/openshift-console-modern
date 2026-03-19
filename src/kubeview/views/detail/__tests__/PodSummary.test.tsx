import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(path.join(__dirname, '..', 'PodSummary.tsx'), 'utf-8');

describe('PodSummary', () => {
  describe('status cards', () => {
    it('shows pod phase status', () => {
      expect(source).toContain('status.phase');
      expect(source).toContain("'Running'");
      expect(source).toContain("'Failed'");
      expect(source).toContain("'Succeeded'");
    });

    it('shows pod IP and host IP', () => {
      expect(source).toContain('podIP');
      expect(source).toContain('hostIP');
    });

    it('shows node name with link', () => {
      expect(source).toContain('nodeName');
      expect(source).toContain('v1~nodes');
    });

    it('shows QoS class', () => {
      expect(source).toContain('qosClass');
    });

    it('shows service account', () => {
      expect(source).toContain('serviceAccountName');
    });

    it('shows restart count', () => {
      expect(source).toContain('totalRestarts');
      expect(source).toContain('restartCount');
    });

    it('shows age', () => {
      expect(source).toContain('formatAge');
      expect(source).toContain('creationTimestamp');
    });
  });

  describe('containers section', () => {
    it('shows container state with icon', () => {
      expect(source).toContain('StateIcon');
      expect(source).toContain('state.running');
      expect(source).toContain('state.waiting');
      expect(source).toContain('state.terminated');
    });

    it('shows resource requests and limits', () => {
      expect(source).toContain('Requests');
      expect(source).toContain('Limits');
      expect(source).toContain('resources.limits.cpu');
      expect(source).toContain('resources.requests.memory');
    });

    it('shows probe details', () => {
      expect(source).toContain('ProbeTag');
      expect(source).toContain('livenessProbe');
      expect(source).toContain('readinessProbe');
      expect(source).toContain('startupProbe');
    });

    it('shows volume mounts per container', () => {
      expect(source).toContain('Volume Mounts');
      expect(source).toContain('volumeMounts');
      expect(source).toContain('mountPath');
    });

    it('shows environment variable count', () => {
      expect(source).toContain('environment variable');
    });

    it('containers are expandable', () => {
      expect(source).toContain('expandedContainers');
      expect(source).toContain('toggleContainer');
    });

    it('shows restart count per container', () => {
      expect(source).toContain('restartCount');
      expect(source).toContain('restart');
    });
  });

  describe('init containers', () => {
    it('shows init containers section', () => {
      expect(source).toContain('Init Containers');
      expect(source).toContain('initContainers');
      expect(source).toContain('initContainerStatuses');
    });
  });

  describe('metrics', () => {
    it('shows pod CPU metric', () => {
      expect(source).toContain('Pod CPU');
      expect(source).toContain('container_cpu_usage_seconds_total');
    });

    it('shows pod Memory metric', () => {
      expect(source).toContain('Pod Memory');
      expect(source).toContain('container_memory_working_set_bytes');
    });

    it('uses sanitizePromQL for safe queries', () => {
      expect(source).toContain('sanitizePromQL');
    });
  });

  describe('volumes', () => {
    it('shows volumes section', () => {
      expect(source).toContain('Volumes');
      expect(source).toContain('volumes.length');
    });

    it('identifies volume types', () => {
      expect(source).toContain("'ConfigMap'");
      expect(source).toContain("'Secret'");
      expect(source).toContain("'PVC'");
      expect(source).toContain("'EmptyDir'");
      expect(source).toContain("'HostPath'");
    });
  });

  describe('integration', () => {
    it('is used in DetailView for Pods', () => {
      const detailView = fs.readFileSync(path.join(__dirname, '..', '..', 'DetailView.tsx'), 'utf-8');
      expect(detailView).toContain('PodSummary');
      expect(detailView).toContain("resource.kind === 'Pod'");
    });
  });
});
