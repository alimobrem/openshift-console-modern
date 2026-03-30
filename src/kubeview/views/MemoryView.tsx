import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, BookOpen, TrendingUp, Search, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '../components/primitives/Card';
import { EmptyState } from '../components/primitives/EmptyState';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { formatRelativeTime } from '../engine/formatters';

const AGENT_BASE = '/api/agent';

interface Runbook {
  name: string;
  description: string;
  tool_sequence: string[];
  success_count: number;
  total_count: number;
}

interface Pattern {
  pattern_type: string;
  description: string;
  keywords: string[];
  frequency: number;
}

interface Incident {
  query: string;
  resolution: string;
  outcome: string;
  score: number;
  timestamp?: number;
}

async function fetchRunbooks(): Promise<Runbook[]> {
  const res = await fetch(`${AGENT_BASE}/memory/runbooks`);
  if (!res.ok) throw new Error('Failed to fetch runbooks');
  return (await res.json()).runbooks || [];
}

async function fetchPatterns(): Promise<Pattern[]> {
  const res = await fetch(`${AGENT_BASE}/memory/patterns`);
  if (!res.ok) throw new Error('Failed to fetch patterns');
  return (await res.json()).patterns || [];
}

async function fetchIncidents(search = ''): Promise<Incident[]> {
  const params = new URLSearchParams({ limit: '20' });
  if (search) params.set('search', search);
  const res = await fetch(`${AGENT_BASE}/memory/incidents?${params}`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return (await res.json()).incidents || [];
}

type Tab = 'runbooks' | 'patterns' | 'incidents';

export default function MemoryView() {
  const [activeTab, setActiveTab] = useState<Tab>('runbooks');
  const [search, setSearch] = useState('');
  const [expandedRunbook, setExpandedRunbook] = useState<string | null>(null);

  const { data: runbooks = [], isLoading: rbLoading } = useQuery({
    queryKey: ['memory', 'runbooks'],
    queryFn: fetchRunbooks,
    staleTime: 30_000,
  });

  const { data: patterns = [], isLoading: patLoading } = useQuery({
    queryKey: ['memory', 'patterns'],
    queryFn: fetchPatterns,
    staleTime: 30_000,
  });

  const { data: incidents = [], isLoading: incLoading } = useQuery({
    queryKey: ['memory', 'incidents', search],
    queryFn: () => fetchIncidents(search),
    staleTime: 15_000,
  });

  const tabs: { id: Tab; label: string; count: number; icon: typeof Brain }[] = [
    { id: 'runbooks', label: 'Learned Runbooks', count: runbooks.length, icon: BookOpen },
    { id: 'patterns', label: 'Detected Patterns', count: patterns.length, icon: TrendingUp },
    { id: 'incidents', label: 'Incident History', count: incidents.length, icon: Brain },
  ];

  return (
    <div className="h-full overflow-auto bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Brain className="w-6 h-6 text-violet-500" />
            What I've Learned
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Runbooks extracted from successful resolutions, patterns detected across incidents, and full interaction history.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'text-violet-400 border-violet-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300',
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Runbooks Tab */}
        {activeTab === 'runbooks' && (
          <div className="space-y-3">
            {rbLoading && <div className="text-sm text-slate-500 animate-pulse">Loading runbooks...</div>}
            {!rbLoading && runbooks.length === 0 && (
              <EmptyState
                icon={<BookOpen className="w-10 h-10 text-slate-600" />}
                title="No runbooks learned yet"
                description="Give thumbs up on helpful responses to teach the agent reusable runbooks."
              />
            )}
            {runbooks.map((rb) => (
              <Card key={rb.name} className="p-4">
                <button
                  onClick={() => setExpandedRunbook(expandedRunbook === rb.name ? null : rb.name)}
                  className="w-full text-left flex items-start gap-3"
                >
                  {expandedRunbook === rb.name ? (
                    <ChevronDown className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">{rb.name}</span>
                      <span className="text-xs text-emerald-400">
                        {rb.success_count}/{rb.total_count} success
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{rb.description}</p>
                  </div>
                </button>
                {expandedRunbook === rb.name && (
                  <div className="mt-3 ml-7 pl-3 border-l-2 border-slate-700">
                    <div className="text-xs font-medium text-slate-400 mb-2">Tool Sequence</div>
                    <div className="flex flex-wrap gap-1.5">
                      {rb.tool_sequence.map((tool, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          {i > 0 && <span className="text-slate-600 mr-1">→</span>}
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="space-y-3">
            {patLoading && <div className="text-sm text-slate-500 animate-pulse">Loading patterns...</div>}
            {!patLoading && patterns.length === 0 && (
              <EmptyState
                icon={<TrendingUp className="w-10 h-10 text-slate-600" />}
                title="No patterns detected yet"
                description="Patterns are detected automatically after every 10 incidents."
              />
            )}
            {patterns.map((pat, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded font-medium shrink-0',
                    pat.pattern_type === 'recurring' ? 'bg-amber-900/50 text-amber-300' : 'bg-blue-900/50 text-blue-300',
                  )}>
                    {pat.pattern_type}
                  </span>
                  <div>
                    <div className="text-sm text-slate-200">{pat.description}</div>
                    {pat.keywords && pat.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {pat.keywords.map((kw, j) => (
                          <span key={j} className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{kw}</span>
                        ))}
                      </div>
                    )}
                    {pat.frequency > 1 && (
                      <span className="text-xs text-slate-500 mt-1 inline-block">Seen {pat.frequency}x</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Incidents Tab */}
        {activeTab === 'incidents' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search incidents..."
                className="w-full bg-slate-900 border border-slate-700 rounded px-9 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                aria-label="Search incidents"
              />
            </div>
            {incLoading && <div className="text-sm text-slate-500 animate-pulse">Loading incidents...</div>}
            {!incLoading && incidents.length === 0 && (
              <EmptyState
                icon={<Brain className="w-10 h-10 text-slate-600" />}
                title={search ? 'No matching incidents' : 'No incidents recorded yet'}
                description="Incidents are recorded automatically from every agent interaction."
              />
            )}
            {incidents.map((inc, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{inc.query}</p>
                    {inc.resolution && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{inc.resolution}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      inc.outcome === 'resolved' ? 'bg-emerald-900/50 text-emerald-300' :
                      inc.outcome === 'unresolved' ? 'bg-red-900/50 text-red-300' :
                      'bg-slate-800 text-slate-400',
                    )}>
                      {inc.outcome || 'unknown'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{inc.score?.toFixed(2) ?? '—'}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
