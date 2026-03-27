/**
 * useMonitor — thin wrapper around useMonitorStore for backward compatibility.
 *
 * Components should prefer importing useMonitorStore directly.
 * The event bus (emitMonitorEvent) is retained for the useMonitor test suite
 * but is no longer used in production — agentNotifications.ts writes
 * directly to useMonitorStore.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Finding, Prediction, ActionReport } from '../engine/monitorClient';

export type { Finding, Prediction, ActionReport };

// ---- Event bus (retained for tests and legacy compatibility) ----

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

/**
 * @deprecated Use useMonitorStore directly for new code.
 */
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
