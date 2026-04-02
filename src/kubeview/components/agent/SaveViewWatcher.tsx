/**
 * SaveViewWatcher — syncs local view state when the agent creates a view.
 * Views are auto-saved on the backend via create_dashboard — this just
 * refreshes the local store and clears the pending spec.
 */

import { useEffect, useRef } from 'react';
import { useAgentStore } from '../../store/agentStore';
import { useCustomViewStore } from '../../store/customViewStore';

export function SaveViewWatcher() {
  const pendingViewSpec = useAgentStore((s) => s.pendingViewSpec);
  const lastHandledViewSpec = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingViewSpec || pendingViewSpec.id === lastHandledViewSpec.current) return;
    lastHandledViewSpec.current = pendingViewSpec.id;

    // Refresh local store (already saved on backend)
    useCustomViewStore.getState().loadViews();
    useAgentStore.setState({ pendingViewSpec: null });
  }, [pendingViewSpec]);

  return null;
}
