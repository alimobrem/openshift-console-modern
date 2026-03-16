import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Plus, Package, Network, Globe, HardDrive, FileText,
  Lock, Shield, Clock, TrendingUp, Folder, User, ShieldCheck,
  Clipboard, AlertCircle,
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useClusterStore } from '../store/clusterStore';
import { buildApiPath } from '../hooks/useResourceUrl';
import YamlEditor from '../components/yaml/YamlEditor';
import { snippets, resolveSnippet, getSnippetSuggestions, type Snippet } from '../components/yaml/SnippetEngine';

interface CreateViewProps {
  gvrKey: string;
}

const templateCategories = [
  {
    title: 'Workloads',
    items: [
      { prefix: 'deploy', icon: Package, color: 'text-blue-400', gvr: 'apps/v1/deployments' },
      { prefix: 'cj', icon: Clock, color: 'text-cyan-400', gvr: 'batch/v1/cronjobs' },
    ],
  },
  {
    title: 'Networking',
    items: [
      { prefix: 'svc', icon: Network, color: 'text-green-400', gvr: 'v1/services' },
      { prefix: 'ing', icon: Globe, color: 'text-purple-400', gvr: 'networking.k8s.io/v1/ingresses' },
      { prefix: 'np', icon: ShieldCheck, color: 'text-red-400', gvr: 'networking.k8s.io/v1/networkpolicies' },
    ],
  },
  {
    title: 'Config & Storage',
    items: [
      { prefix: 'cm', icon: FileText, color: 'text-yellow-400', gvr: 'v1/configmaps' },
      { prefix: 'secret', icon: Lock, color: 'text-red-400', gvr: 'v1/secrets' },
      { prefix: 'pvc', icon: HardDrive, color: 'text-orange-400', gvr: 'v1/persistentvolumeclaims' },
    ],
  },
  {
    title: 'Access Control',
    items: [
      { prefix: 'ns', icon: Folder, color: 'text-amber-400', gvr: 'v1/namespaces' },
      { prefix: 'sa', icon: User, color: 'text-teal-400', gvr: 'v1/serviceaccounts' },
      { prefix: 'rb', icon: Shield, color: 'text-indigo-400', gvr: 'rbac.authorization.k8s.io/v1/rolebindings' },
      { prefix: 'hpa', icon: TrendingUp, color: 'text-pink-400', gvr: 'autoscaling/v2/horizontalpodautoscalers' },
    ],
  },
];

export default function CreateView({ gvrKey }: CreateViewProps) {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const addTab = useUIStore((s) => s.addTab);
  const selectedNamespace = useUIStore((s) => s.selectedNamespace);
  const registry = useClusterStore((s) => s.resourceRegistry);

  const [step, setStep] = useState<'pick' | 'edit'>('pick');
  const [activeGvr, setActiveGvr] = useState(gvrKey);
  const [yaml, setYaml] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gvrParts = activeGvr.split('/');
  const resourcePlural = gvrParts[gvrParts.length - 1];
  const resourceType = registry?.get(activeGvr) ?? (activeGvr.split('/').length === 2 ? registry?.get(`core/${activeGvr}`) : undefined);
  const kind = resourceType?.kind || resourcePlural.replace(/s$/, '').replace(/^./, (c) => c.toUpperCase());

  function selectTemplate(snippet: Snippet, gvr: string) {
    const resolved = resolveSnippet(snippet);
    // Replace default namespace with selected
    const ns = selectedNamespace !== '*' ? selectedNamespace : 'default';
    const withNs = resolved.replace(/namespace: default/, `namespace: ${ns}`);
    setYaml(withNs);
    setActiveGvr(gvr);
    setStep('edit');
    setError(null);
  }

  function selectBlankYaml(gvr: string) {
    const parts = gvr.split('/');
    const group = parts.length === 3 ? parts[0] : '';
    const version = parts.length === 3 ? parts[1] : parts[0];
    const plural = parts[parts.length - 1];
    const apiVersion = group ? `${group}/${version}` : version;
    const shortName = plural.replace(/s$/, '');
    const kindName = shortName.charAt(0).toUpperCase() + shortName.slice(1);
    const ns = selectedNamespace !== '*' ? selectedNamespace : 'default';
    const rt = registry?.get(gvr) ?? (parts.length === 2 ? registry?.get(`core/${gvr}`) : undefined);

    setYaml([
      `apiVersion: ${apiVersion}`,
      `kind: ${kindName}`,
      'metadata:',
      `  name: my-${shortName}`,
      rt?.namespaced !== false ? `  namespace: ${ns}` : null,
      'spec: {}',
    ].filter(Boolean).join('\n'));
    setActiveGvr(gvr);
    setStep('edit');
    setError(null);
  }

  // If we came with a specific GVR, go straight to editor
  useMemo(() => {
    if (gvrKey !== 'v1/pods') {
      const shortName = resourcePlural.replace(/s$/, '').toLowerCase();
      const snips = getSnippetSuggestions(shortName);
      if (snips.length > 0) {
        const resolved = resolveSnippet(snips[0]);
        const ns = selectedNamespace !== '*' ? selectedNamespace : 'default';
        setYaml(resolved.replace(/namespace: default/, `namespace: ${ns}`));
      } else {
        selectBlankYaml(gvrKey);
      }
      setStep('edit');
    }
  }, []);

  const handleCreate = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const nsMatch = yaml.match(/namespace:\s*(\S+)/);
      const ns = nsMatch?.[1] || (resourceType?.namespaced ? (selectedNamespace !== '*' ? selectedNamespace : 'default') : undefined);
      const apiPath = buildApiPath(activeGvr, ns);

      const res = await fetch(`/api/kubernetes${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/yaml' },
        body: yaml,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(body.message || `${res.status}: ${res.statusText}`);
      }

      const created = await res.json();
      const createdName = created.metadata?.name || 'resource';
      const createdNs = created.metadata?.namespace;

      addToast({ type: 'success', title: `${kind} "${createdName}" created` });

      const gvrUrl = activeGvr.replace(/\//g, '~');
      const detailPath = createdNs ? `/r/${gvrUrl}/${createdNs}/${createdName}` : `/r/${gvrUrl}/_/${createdName}`;
      addTab({ title: createdName, path: detailPath, pinned: false, closable: true });
      navigate(detailPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      addToast({ type: 'error', title: 'Failed to create resource', detail: msg });
    } finally {
      setCreating(false);
    }
  }, [yaml, activeGvr, kind, creating, selectedNamespace, resourceType, addToast, navigate, addTab]);

  const handlePaste = useCallback(() => {
    navigator.clipboard.readText().then((text) => {
      if (text.includes('apiVersion:') && text.includes('kind:')) {
        setYaml(text);
        setStep('edit');
      }
    }).catch(() => {});
  }, []);

  if (step === 'pick') {
    return (
      <div className="h-full overflow-auto bg-slate-950 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-6 h-6 text-blue-500" />
              Create Resource
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Choose a template to get started, or paste YAML from your clipboard
            </p>
          </div>

          {/* Paste from clipboard */}
          <button
            onClick={handlePaste}
            className="w-full flex items-center gap-3 p-4 bg-slate-900 rounded-lg border border-dashed border-slate-700 hover:border-blue-600 transition-colors text-left"
          >
            <Clipboard className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm font-medium text-slate-200">Paste from Clipboard</div>
              <div className="text-xs text-slate-500">Paste a Kubernetes YAML resource from your clipboard</div>
            </div>
          </button>

          {/* Template categories */}
          {templateCategories.map((cat) => (
            <div key={cat.title}>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{cat.title}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {cat.items.map((item) => {
                  const snippet = snippets.find((s) => s.prefix === item.prefix);
                  if (!snippet) return null;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.prefix}
                      onClick={() => selectTemplate(snippet, item.gvr)}
                      className="flex flex-col items-start gap-2 p-4 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors text-left"
                    >
                      <Icon className={cn('w-5 h-5', item.color)} />
                      <div>
                        <div className="text-sm font-medium text-slate-200">{snippet.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{snippet.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Blank YAML */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Or start from scratch</h2>
            <button
              onClick={() => { setYaml(''); setStep('edit'); }}
              className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors"
            >
              <FileText className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <div className="text-sm font-medium text-slate-200">Blank YAML</div>
                <div className="text-xs text-slate-500">Start with an empty editor</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep('pick')}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            title="Back to templates"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm font-medium text-slate-200">Create {kind}</span>
          <span className="text-xs text-slate-500">
            {gvrParts.length === 3 ? `${gvrParts[0]}/${gvrParts[1]}` : gvrParts[0]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreate}
            disabled={creating || !yaml.trim()}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-md font-medium transition-colors',
              creating || !yaml.trim()
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            )}
          >
            <Plus size={12} />
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-2 bg-red-950/50 border-b border-red-900 text-sm">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-red-300 text-xs flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-xs">Dismiss</button>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <YamlEditor
          value={yaml}
          onChange={setYaml}
          onSave={handleCreate}
          height="100%"
        />
      </div>
    </div>
  );
}
