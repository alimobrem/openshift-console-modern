/**
 * Agent Notifications — connects to /ws/monitor for real-time findings,
 * falling back to 5-minute polling for v1 agents.
 */

import { AgentClient } from './agentClient';
import type { AgentEvent } from './agentClient';
import { useUIStore } from '../store/uiStore';
import { useAgentStore } from '../store/agentStore';
import { useMonitorStore } from '../store/monitorStore';
import type { Finding, Prediction, ActionReport } from './monitorClient';

const DEFAULT_INTERVAL = 300_000; // 5 minutes
const PROMPT =
  'Briefly check for critical issues or anomalies. For each issue, name the affected resource and give a one-line fix. 3 sentences max. If nothing notable, respond with just "OK".';

let running = false;

// --- v2 monitor state ---
let monitorWs: WebSocket | null = null;
let monitorReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let monitorReconnectAttempts = 0;
const MONITOR_RECONNECT_MAX_DELAY = 30_000;

// --- v1 fallback state ---
let intervalId: ReturnType<typeof setInterval> | null = null;
let polling = false; // guard against overlapping polls
let client: AgentClient | null = null;

const AGENT_BASE = '/api/agent';
const QUERY_TIMEOUT = 30_000; // 30s max per query

async function detectProtocol(): Promise<'2' | '1' | null> {
  try {
    const res = await fetch(`${AGENT_BASE}/version`);
    if (!res.ok) return '1'; // old agent without proper /version
    const data = await res.json();
    return data.protocol === '2' ? '2' : '1';
  } catch {
    return null; // agent unavailable
  }
}

// --- v2: Monitor WebSocket ---

function connectMonitor() {
  if (monitorWs) {
    monitorWs.close();
    monitorWs = null;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}${AGENT_BASE}/ws/monitor`;

  monitorWs = new WebSocket(url);

  monitorWs.onopen = () => {
    monitorReconnectAttempts = 0;
    useMonitorStore.setState({ connected: true });
  };

  monitorWs.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as Record<string, unknown>;
      const eventType = data.type as string;
      const monitorState = useMonitorStore.getState();

      if (eventType === 'finding') {
        const { type: _, ...finding } = data as unknown as { type: string } & Finding;
        // Skip dismissed findings
        if (!monitorState.dismissedFindingIds.includes(finding.id)) {
          useMonitorStore.setState((s) => ({
            findings: [...s.findings.filter((f) => f.id !== finding.id), finding].slice(-200),
            unreadCount: s.unreadCount + 1,
          }));
        }

        // Show toast for critical/warning findings
        if (finding.severity === 'critical' || finding.severity === 'warning') {
          const store = useUIStore.getState();
          store.addToast({
            type: finding.severity === 'critical' ? 'error' : 'warning',
            title: `Monitor: ${finding.title}`,
            detail: finding.summary,
            duration: 15000,
            action: {
              label: 'Investigate',
              onClick: () => {
                store.openDock('agent');
                const agentStore = useAgentStore.getState();
                if (agentStore.connected) {
                  agentStore.sendMessage(
                    `The monitor detected this issue:\n\n"${finding.title}: ${finding.summary}"\n\nInvestigate this further. What is the root cause and what should I do to fix it?`,
                  );
                }
              },
            },
          });
        }
      } else if (eventType === 'prediction') {
        const { type: _, ...prediction } = data as unknown as { type: string } & Prediction;
        useMonitorStore.setState((s) => ({
          predictions: [...s.predictions.filter((p) => p.id !== prediction.id), prediction].slice(-50),
          unreadCount: s.unreadCount + 1,
        }));
      } else if (eventType === 'action_report') {
        const { type: _, ...report } = data as unknown as { type: string } & ActionReport;
        if (report.status === 'proposed') {
          useMonitorStore.setState((s) => ({
            pendingActions: [...s.pendingActions, report],
            unreadCount: s.unreadCount + 1,
          }));
        } else {
          useMonitorStore.setState((s) => ({
            pendingActions: s.pendingActions.filter((a) => a.id !== report.id),
            recentActions: [...s.recentActions, report].slice(-50),
          }));
        }
      } else if (eventType === 'monitor_status') {
        const statusData = data as unknown as { activeWatches: string[]; lastScan: number; nextScan: number };
        useMonitorStore.setState({
          activeWatches: statusData.activeWatches,
          lastScanTime: statusData.lastScan,
          nextScanTime: statusData.nextScan,
        });
      }
    } catch {
      // Silently skip unparseable messages
    }
  };

  monitorWs.onclose = () => {
    monitorWs = null;
    useMonitorStore.setState({ connected: false });

    if (!running) return;

    // Reconnect with exponential backoff + jitter
    const baseDelay = Math.min(
      1000 * Math.pow(2, monitorReconnectAttempts),
      MONITOR_RECONNECT_MAX_DELAY,
    );
    const jitter = Math.random() * 1000;
    monitorReconnectAttempts++;

    monitorReconnectTimer = setTimeout(() => {
      monitorReconnectTimer = null;
      if (running) connectMonitor();
    }, baseDelay + jitter);
  };

  monitorWs.onerror = () => {
    // onclose will fire after onerror — reconnect handled there
  };
}

function disconnectMonitor() {
  if (monitorReconnectTimer) {
    clearTimeout(monitorReconnectTimer);
    monitorReconnectTimer = null;
  }
  monitorReconnectAttempts = 0;
  if (monitorWs) {
    monitorWs.close();
    monitorWs = null;
  }
  useMonitorStore.setState({ connected: false });
}

// --- v1: Polling fallback ---

function query(): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const c = new AgentClient('sre');
    client = c;

    function cleanup() {
      if (!settled) {
        settled = true;
        unsub();
        c.disconnect();
        client = null;
      }
    }

    const unsub = c.on((event: AgentEvent) => {
      if (settled) return;
      switch (event.type) {
        case 'connected':
          c.send(PROMPT);
          break;
        case 'done':
          cleanup();
          resolve(event.full_response);
          break;
        case 'error':
          cleanup();
          reject(new Error(event.message));
          break;
        case 'disconnected':
          cleanup();
          reject(new Error('Disconnected'));
          break;
      }
    });

    // Timeout to prevent leaked connections
    setTimeout(() => {
      if (!settled) {
        cleanup();
        reject(new Error('Query timed out'));
      }
    }, QUERY_TIMEOUT);

    c.connect();
  });
}

async function poll() {
  if (polling) return; // previous poll still running
  polling = true;
  try {
    const response = await query();
    const trimmed = response.trim();

    // Only notify if the agent found something notable
    if (trimmed && trimmed !== 'OK' && trimmed.toLowerCase() !== 'ok') {
      const store = useUIStore.getState();
      store.addToast({
        type: 'warning',
        title: 'AI Insight',
        detail: trimmed,
        duration: 15000,
        action: {
          label: 'Investigate',
          onClick: () => {
            store.openDock('agent');
            // Send the insight to the agent so it continues the thread
            const agentStore = useAgentStore.getState();
            if (agentStore.connected) {
              agentStore.sendMessage(
                `The background health check found this issue:\n\n"${trimmed}"\n\nInvestigate this further. What is the root cause and what should I do to fix it?`,
              );
            }
          },
        },
      });
    }
  } catch {
    // Silently skip — agent may be unavailable
  } finally {
    polling = false;
  }
}

// --- Public API ---

export async function startAgentNotifications(intervalMs = DEFAULT_INTERVAL) {
  if (running) return;
  running = true;

  const protocol = await detectProtocol();

  if (protocol === '2') {
    connectMonitor();
  } else if (protocol === '1') {
    // Fall back to existing polling
    intervalId = setInterval(poll, intervalMs);
  }
  // If null (no agent), do nothing — will retry on next call
}

export function stopAgentNotifications() {
  running = false;
  disconnectMonitor();
  // Also stop v1 polling
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (client) {
    client.disconnect();
    client = null;
  }
  polling = false;
}

export function isAgentNotificationsRunning(): boolean {
  return running;
}
