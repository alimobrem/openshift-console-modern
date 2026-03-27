/**
 * useIncidentFeed — unified hook that merges incident data from 4 sources
 * (monitor findings, tracked errors, Prometheus alerts, timeline entries)
 * into a single deduplicated, sorted IncidentItem[].
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMonitorStore } from '../store/monitorStore';
import { useErrorStore, type TrackedError } from '../store/errorStore';
import type { Finding } from '../engine/monitorClient';
import type { TimelineEntry } from '../engine/types/timeline';
import { useIncidentTimeline, type TimeRange } from './useIncidentTimeline';

// TODO: Import IncidentItem and IncidentSource from engine/types/incident.ts
// once that file is available.

export type IncidentSource = 'finding' | 'error' | 'alert' | 'timeline';
export type IncidentSeverity = 'critical' | 'warning' | 'info';

export interface IncidentItem {
  id: string;
  correlationKey: string;
  source: IncidentSource;
  severity: IncidentSeverity;
  title: string;
  detail: string;
  timestamp: number; // epoch ms
  namespace?: string;
  resourceKind?: string;
  resourceName?: string;
}

export interface UseIncidentFeedOptions {
  severity?: IncidentSeverity;
  limit?: number;
  sources?: IncidentSource[];
}

export interface UseIncidentFeedResult {
  incidents: IncidentItem[];
  isLoading: boolean;
  counts: { critical: number; warning: number; info: number; total: number };
}

const SEVERITY_ORDER: Record<IncidentSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

// TODO: Move mappers to engine/types/incident.ts once available.

function findingToIncident(f: Finding): IncidentItem {
  const resourceRef = f.resources?.[0];
  return {
    id: `finding:${f.id}`,
    correlationKey: resourceRef
      ? `${resourceRef.kind}/${resourceRef.name}/${resourceRef.namespace ?? '_'}`
      : `finding:${f.id}`,
    source: 'finding',
    severity: f.severity,
    title: f.title,
    detail: f.summary,
    timestamp: f.timestamp,
    namespace: resourceRef?.namespace,
    resourceKind: resourceRef?.kind,
    resourceName: resourceRef?.name,
  };
}

function errorToIncident(e: TrackedError): IncidentItem {
  const severity: IncidentSeverity =
    e.category === 'server' || e.statusCode >= 500
      ? 'critical'
      : e.category === 'permission'
        ? 'warning'
        : 'info';
  return {
    id: `error:${e.id}`,
    correlationKey: e.resourceKind && e.resourceName
      ? `${e.resourceKind}/${e.resourceName}/${e.namespace ?? '_'}`
      : `error:${e.id}`,
    source: 'error',
    severity,
    title: e.userMessage,
    detail: e.message,
    timestamp: e.timestamp,
    namespace: e.namespace,
    resourceKind: e.resourceKind,
    resourceName: e.resourceName,
  };
}

interface PrometheusAlertRule {
  name: string;
  type: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  alerts?: Array<{
    labels: Record<string, string>;
    annotations: Record<string, string>;
    state: 'firing' | 'pending' | 'inactive';
    activeAt?: string;
  }>;
}

interface PrometheusAlertGroup {
  name: string;
  rules: PrometheusAlertRule[];
}

function promAlertsToIncidents(groups: PrometheusAlertGroup[]): IncidentItem[] {
  const items: IncidentItem[] = [];
  for (const group of groups) {
    for (const rule of group.rules) {
      if (rule.type !== 'alerting') continue;
      for (const alert of rule.alerts ?? []) {
        if (alert.state !== 'firing') continue;
        const severity: IncidentSeverity =
          (alert.labels.severity as IncidentSeverity) ?? 'warning';
        const validSeverity: IncidentSeverity =
          severity in SEVERITY_ORDER ? severity : 'warning';
        const ns = alert.labels.namespace ?? '';
        const resourceName =
          alert.labels.pod ??
          alert.labels.deployment ??
          alert.labels.node ??
          '';
        const resourceKind = alert.labels.pod
          ? 'Pod'
          : alert.labels.deployment
            ? 'Deployment'
            : alert.labels.node
              ? 'Node'
              : undefined;

        items.push({
          id: `alert:${rule.name}:${JSON.stringify(alert.labels)}`,
          correlationKey: resourceKind && resourceName
            ? `${resourceKind}/${resourceName}/${ns || '_'}`
            : `alert:${rule.name}`,
          source: 'alert',
          severity: validSeverity,
          title: rule.name,
          detail:
            alert.annotations?.description ??
            alert.annotations?.message ??
            rule.annotations?.description ??
            '',
          timestamp: alert.activeAt
            ? new Date(alert.activeAt).getTime()
            : Date.now(),
          namespace: ns || undefined,
          resourceKind,
          resourceName: resourceName || undefined,
        });
      }
    }
  }
  return items;
}

function timelineToIncident(entry: TimelineEntry): IncidentItem {
  const severity: IncidentSeverity =
    entry.severity === 'normal' ? 'info' : entry.severity;
  return {
    id: `timeline:${entry.id}`,
    correlationKey:
      entry.correlationKey ??
      (entry.resource
        ? `${entry.resource.kind}/${entry.resource.name}/${entry.resource.namespace ?? '_'}`
        : `timeline:${entry.id}`),
    source: 'timeline',
    severity,
    title: entry.title,
    detail: entry.detail,
    timestamp: new Date(entry.timestamp).getTime(),
    namespace: entry.namespace ?? entry.resource?.namespace,
    resourceKind: entry.resource?.kind,
    resourceName: entry.resource?.name,
  };
}

const DEFAULT_SOURCES: IncidentSource[] = ['finding', 'error', 'alert', 'timeline'];
const ALL_TIMELINE_CATEGORIES = new Set(['alert', 'event', 'rollout', 'config'] as const);

export function useIncidentFeed(
  options: UseIncidentFeedOptions = {},
): UseIncidentFeedResult {
  const { severity: severityFilter, limit, sources = DEFAULT_SOURCES } = options;

  const findings = useMonitorStore((s) => s.findings);
  const errors = useErrorStore((s) => s.errors);

  const { data: alertGroups = [], isLoading: alertsLoading } = useQuery<
    PrometheusAlertGroup[]
  >({
    queryKey: ['incidentFeed', 'alerts'],
    queryFn: async () => {
      const res = await fetch('/api/prometheus/api/v1/rules');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data?.groups ?? [];
    },
    refetchInterval: 30000,
    enabled: sources.includes('alert'),
  });

  const timelineEnabled = sources.includes('timeline');
  const timeline = useIncidentTimeline({
    timeRange: '1h' as TimeRange,
    categories: ALL_TIMELINE_CATEGORIES,
  });
  const timelineEntries: TimelineEntry[] = timelineEnabled
    ? timeline.entries ?? []
    : [];
  const timelineLoading = timelineEnabled ? timeline.isLoading : false;

  const result = useMemo(() => {
    let items: IncidentItem[] = [];

    if (sources.includes('finding')) {
      items = items.concat(findings.map(findingToIncident));
    }

    if (sources.includes('error')) {
      const unresolvedErrors = errors.filter((e) => !e.resolved);
      items = items.concat(unresolvedErrors.map(errorToIncident));
    }

    if (sources.includes('alert')) {
      items = items.concat(promAlertsToIncidents(alertGroups));
    }

    if (sources.includes('timeline')) {
      items = items.concat(timelineEntries.map(timelineToIncident));
    }

    if (severityFilter) {
      items = items.filter((i) => i.severity === severityFilter);
    }

    // Keep highest severity per correlationKey, break ties by newest timestamp
    const deduped = new Map<string, IncidentItem>();
    for (const item of items) {
      const existing = deduped.get(item.correlationKey);
      if (!existing) {
        deduped.set(item.correlationKey, item);
      } else {
        const existingSev = SEVERITY_ORDER[existing.severity];
        const newSev = SEVERITY_ORDER[item.severity];
        if (newSev < existingSev || (newSev === existingSev && item.timestamp > existing.timestamp)) {
          deduped.set(item.correlationKey, item);
        }
      }
    }

    let sorted = Array.from(deduped.values()).sort((a, b) => {
      const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return b.timestamp - a.timestamp;
    });

    const counts = { critical: 0, warning: 0, info: 0, total: sorted.length };
    for (const item of sorted) {
      counts[item.severity]++;
    }

    if (limit !== undefined && limit > 0) {
      sorted = sorted.slice(0, limit);
    }

    return { incidents: sorted, counts };
  }, [findings, errors, alertGroups, timelineEntries, severityFilter, limit, sources]);

  const isLoading = alertsLoading || timelineLoading;

  return {
    incidents: result.incidents,
    isLoading,
    counts: result.counts,
  };
}
