/**
 * AgentChart — recharts-based chart renderer for agent component specs.
 * Lazy-loaded to keep recharts (~150KB) out of the initial bundle.
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import {
  LineChart, BarChart, AreaChart,
  Line, Bar, Area,
  XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { ChartSpec, ComponentSpec } from '../../engine/agentComponents';

const CHART_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8', '#fb923c', '#e879f9'];

const _chartTimeFmt = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' });
function formatTimestamp(ts: number) {
  return _chartTimeFmt.format(ts);
}

export default function AgentChart({ spec, onAddToView }: { spec: ChartSpec; onAddToView?: (spec: ComponentSpec) => void }) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>(spec.chartType || 'line');
  const height = spec.height || 300;

  const rechartsData = useMemo(() => {
    const timeMap = new Map<number, Record<string, number>>();
    for (const series of spec.series) {
      for (const [ts, val] of series.data) {
        const entry = timeMap.get(ts) || { time: ts };
        entry[series.label] = val;
        timeMap.set(ts, entry);
      }
    }
    return Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
  }, [spec.series]);

  const ChartComponent = chartType === 'bar' ? BarChart : chartType === 'area' ? AreaChart : LineChart;

  return (
    <div className="my-2 border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50 min-w-0">
      <div className="px-3 py-1.5 border-b border-slate-700 flex items-center justify-between">
        <div className="truncate">
          <span className="text-xs font-medium text-slate-300">{spec.title || 'Chart'}</span>
          {spec.description && <span className="text-[10px] text-slate-500 ml-2">{spec.description}</span>}
        </div>
        <div className="flex items-center gap-1">
          {(['line', 'bar', 'area'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={cn(
                'px-1.5 py-0.5 text-[10px] rounded transition-colors',
                chartType === type ? 'bg-violet-700 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800',
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
          {onAddToView && (
            <button
              onClick={() => onAddToView({ ...spec, chartType })}
              className="ml-1 p-0.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
              title="Add to View"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-2" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={rechartsData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" tickFormatter={formatTimestamp} stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }}
              label={spec.yAxisLabel ? { value: spec.yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 10 } } : undefined} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }}
              labelFormatter={(label) => typeof label === 'number' ? formatTimestamp(label) : String(label)}
              labelStyle={{ color: '#94a3b8' }} />
            {spec.series.length > 1 && spec.series.length <= 6 && <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />}
            {spec.series.map((s, i) => {
              const color = s.color || CHART_COLORS[i % CHART_COLORS.length];
              if (chartType === 'bar') return <Bar key={s.label} dataKey={s.label} fill={color} fillOpacity={0.8} />;
              if (chartType === 'area') return <Area key={s.label} dataKey={s.label} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={1.5} dot={false} />;
              return <Line key={s.label} dataKey={s.label} stroke={color} strokeWidth={1.5} dot={false} />;
            })}
          </ChartComponent>
        </ResponsiveContainer>
      </div>

      {spec.query && (
        <div className="px-3 py-1 border-t border-slate-700 text-[10px] text-slate-600 truncate" title={spec.query}>
          PromQL: {spec.query}
        </div>
      )}
    </div>
  );
}
