import { DollarSign, Shield, Box, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimulationResult, RiskLevel } from '../../engine/types/mvpTypes';

interface SimulationPanelProps {
  simulation: SimulationResult;
}

const riskColors: Record<RiskLevel, string> = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

const riskBg: Record<RiskLevel, string> = {
  low: 'bg-emerald-500/10 border-emerald-500/20',
  medium: 'bg-amber-500/10 border-amber-500/20',
  high: 'bg-orange-500/10 border-orange-500/20',
  critical: 'bg-red-500/10 border-red-500/20',
};

export function SimulationPanel({ simulation }: SimulationPanelProps) {
  const { costDelta, securityPosture, resourceImpact, latencyEstimate, riskScore, confidence, executionTimeMinutes } = simulation;

  const costDir = costDelta.changePercent > 0 ? '+' : '';
  const secDelta = securityPosture.projected - securityPosture.current;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Simulation Results
        </h3>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', riskBg[riskScore], riskColors[riskScore])}>
            {riskScore} risk
          </span>
          <span className="text-xs text-slate-500">
            {Math.round(confidence * 100)}% confidence
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">Cost Impact</span>
          </div>
          <div className={cn('text-lg font-bold', costDelta.changePercent > 0 ? 'text-amber-400' : costDelta.changePercent < 0 ? 'text-emerald-400' : 'text-slate-300')}>
            {costDir}{costDelta.changePercent}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {costDelta.current} &rarr; {costDelta.projected} units
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">Security Posture</span>
          </div>
          <div className={cn('text-lg font-bold', secDelta > 0 ? 'text-emerald-400' : secDelta < 0 ? 'text-red-400' : 'text-slate-300')}>
            {securityPosture.projected}/100
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {secDelta > 0 ? '+' : ''}{secDelta} from {securityPosture.current}
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Box className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">Resource Changes</span>
          </div>
          <div className="space-y-1">
            {resourceImpact.added.length > 0 && (
              <p className="text-xs text-emerald-400">+{resourceImpact.added.length} added</p>
            )}
            {resourceImpact.modified.length > 0 && (
              <p className="text-xs text-amber-400">~{resourceImpact.modified.length} modified</p>
            )}
            {resourceImpact.removed.length > 0 && (
              <p className="text-xs text-red-400">-{resourceImpact.removed.length} removed</p>
            )}
            {resourceImpact.added.length === 0 && resourceImpact.modified.length === 0 && resourceImpact.removed.length === 0 && (
              <p className="text-xs text-slate-500">No changes</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">Performance</span>
          </div>
          <div className="text-lg font-bold text-slate-300">
            {latencyEstimate.p50Ms}ms
          </div>
          <p className="text-xs text-slate-500 mt-1">
            p99: {latencyEstimate.p99Ms}ms &middot; ~{executionTimeMinutes}min to execute
          </p>
        </div>
      </div>

      {securityPosture.details.length > 0 && securityPosture.details[0] !== 'No security impact detected' && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2">
          <p className="text-xs font-medium text-slate-400 mb-1">Security details</p>
          <ul className="space-y-0.5">
            {securityPosture.details.map((d, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
