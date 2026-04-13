import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot } from 'lucide-react';
import {
  fetchFixHistorySummary,
  fetchScannerCoverage,
  fetchConfidenceCalibration,
  fetchAccuracyStats,
  fetchCostStats,
  fetchRecommendations,
  fetchReadinessSummary,
} from '../engine/analyticsApi';
import { fetchAgentEvalStatus } from '../engine/evalStatus';
import { TrustPolicy } from './mission-control/TrustPolicy';
import { AgentHealth } from './mission-control/AgentHealth';
import { AgentAccuracy } from './mission-control/AgentAccuracy';
import { CapabilityDiscovery } from './mission-control/CapabilityDiscovery';
import { ScannerDrawer } from './mission-control/ScannerDrawer';
import { EvalDrawer } from './mission-control/EvalDrawer';
import { MemoryDrawer } from './mission-control/MemoryDrawer';

export default function MissionControlView() {
  const [drawerOpen, setDrawerOpen] = useState<'scanner' | 'eval' | 'memory' | null>(null);

  // Data queries
  const { data: evalStatus } = useQuery({
    queryKey: ['agent', 'eval-status'],
    queryFn: () => fetchAgentEvalStatus().catch(() => null),
    refetchInterval: 60_000,
  });

  const { data: fixSummary } = useQuery({
    queryKey: ['agent', 'fix-history-summary'],
    queryFn: () => fetchFixHistorySummary().catch(() => null),
    staleTime: 60_000,
  });

  const { data: coverage } = useQuery({
    queryKey: ['agent', 'scanner-coverage'],
    queryFn: () => fetchScannerCoverage().catch(() => null),
    staleTime: 60_000,
  });

  const { data: confidence } = useQuery({
    queryKey: ['agent', 'confidence'],
    queryFn: () => fetchConfidenceCalibration().catch(() => null),
    staleTime: 60_000,
  });

  const { data: accuracy } = useQuery({
    queryKey: ['agent', 'accuracy'],
    queryFn: () => fetchAccuracyStats().catch(() => null),
    staleTime: 60_000,
  });

  const { data: costStats } = useQuery({
    queryKey: ['agent', 'cost'],
    queryFn: () => fetchCostStats().catch(() => null),
    staleTime: 60_000,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['agent', 'recommendations'],
    queryFn: () => fetchRecommendations().catch(() => null),
    staleTime: 5 * 60_000,
  });

  const { data: readiness } = useQuery({
    queryKey: ['agent', 'readiness-summary'],
    queryFn: () => fetchReadinessSummary().catch(() => null),
    staleTime: 60_000,
  });

  const { data: capabilities } = useQuery({
    queryKey: ['monitor', 'capabilities'],
    queryFn: async () => {
      const res = await fetch('/api/agent/monitor/capabilities');
      if (!res.ok) return { max_trust_level: 4 };
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: version } = useQuery({
    queryKey: ['agent', 'version'],
    queryFn: async () => {
      const res = await fetch('/api/agent/version');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60_000,
  });

  return (
    <div className="h-full overflow-auto bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-violet-400" />
          <h1 className="text-lg font-semibold text-slate-100">Mission Control</h1>
          {version && (
            <span className="text-xs text-slate-500">
              v{version.agent} &middot; Protocol v{version.protocol} &middot; {version.tools} tools
            </span>
          )}
        </div>

        {/* Section 1: Trust Policy */}
        <TrustPolicy
          maxTrustLevel={capabilities?.max_trust_level ?? 4}
          scannerCount={coverage?.active_scanners ?? 0}
          fixSummary={fixSummary ?? null}
        />

        {/* Section 2: Agent Health */}
        <AgentHealth
          evalStatus={evalStatus}
          coverage={coverage ?? null}
          fixSummary={fixSummary ?? null}
          confidence={confidence ?? null}
          costStats={costStats ?? null}
          readiness={readiness ?? null}
          onOpenScannerDrawer={() => setDrawerOpen('scanner')}
          onOpenEvalDrawer={() => setDrawerOpen('eval')}
          onOpenMemoryDrawer={() => setDrawerOpen('memory')}
          memoryPatternCount={accuracy?.learning?.total_patterns ?? 0}
        />

        {/* Section 2b: Agent Accuracy */}
        <AgentAccuracy
          accuracy={accuracy ?? null}
          onOpenMemoryDrawer={() => setDrawerOpen('memory')}
        />

        {/* Section 3: Capability Discovery */}
        {recommendations?.recommendations && (
          <CapabilityDiscovery recommendations={recommendations.recommendations} />
        )}
      </div>

      {/* Drawers */}
      {drawerOpen === 'scanner' && <ScannerDrawer onClose={() => setDrawerOpen(null)} />}
      {drawerOpen === 'eval' && <EvalDrawer onClose={() => setDrawerOpen(null)} />}
      {drawerOpen === 'memory' && <MemoryDrawer onClose={() => setDrawerOpen(null)} />}
    </div>
  );
}
