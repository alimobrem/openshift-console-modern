/**
 * useMonitor — hook for components to access real-time monitoring state.
 *
 * Provides findings, predictions, and action reports pushed via the
 * monitor WebSocket (v2) or polled via the agent (v1 fallback).
 * Uses a module-level event bus so multiple consumers stay in sync.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface Finding {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  summary: string;
  resources: Array<{ kind: string; name: string; namespace?: string }>;
  autoFixable: boolean;
  timestamp: number;
}

export interface Prediction {
  id: string;
  category: string;
  title: string;
  detail: string;
  eta: string;
  confidence: number;
  resources: Array<{ kind: string; name: string; namespace?: string }>;
  recommendedAction?: string;
  timestamp: number;
}

export interface ActionReport {
  id: string;
  findingId: string;
  tool: string;
  status: 'proposed' | 'executing' | 'completed' | 'failed' | 'rolled_back';
  timestamp: number;
}

export type MonitorBusEvent =
  | { type: 'finding'; data: Finding }
  | { type: 'prediction'; data: Prediction }
  | { type: 'action_report'; data: ActionReport }
  | { type: 'status'; connected: boolean };

type MonitorListener = (event: MonitorBusEvent) => void;

const listeners = new Set<MonitorListener>();

/** Broadcast a monitor event to all useMonitor consumers. */
export function emitMonitorEvent(event: MonitorBusEvent) {
  for (const l of listeners) l(event);
}

/** Clear all listeners — used for testing only. */
export function _resetMonitorListeners() {
  listeners.clear();
}

const MAX_FINDINGS = 200;
const MAX_PREDICTIONS = 50;

export function useMonitor() {
  const [connected, setConnected] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [pendingActions, setPendingActions] = useState<ActionReport[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handler: MonitorListener = (event) => {
      switch (event.type) {
        case 'finding':
          setFindings((prev) => {
            const updated = [event.data, ...prev.filter((f) => f.id !== event.data.id)].slice(
              0,
              MAX_FINDINGS,
            );
            setUnreadCount((c) => c + 1);
            return updated;
          });
          break;
        case 'prediction':
          setPredictions((prev) =>
            [event.data, ...prev.filter((p) => p.id !== event.data.id)].slice(0, MAX_PREDICTIONS),
          );
          break;
        case 'action_report':
          if (event.data.status === 'proposed') {
            setPendingActions((prev) => [...prev, event.data]);
          } else {
            setPendingActions((prev) => prev.filter((a) => a.id !== event.data.id));
          }
          break;
        case 'status':
          setConnected(event.connected);
          break;
      }
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const dismissFinding = useCallback((id: string) => {
    setFindings((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const criticalCount = useMemo(() => findings.filter((f) => f.severity === 'critical').length, [findings]);
  const warningCount = useMemo(() => findings.filter((f) => f.severity === 'warning').length, [findings]);

  return {
    connected,
    findings,
    predictions,
    pendingActions,
    unreadCount,
    criticalCount,
    warningCount,
    dismissFinding,
    markAllRead,
  };
}
