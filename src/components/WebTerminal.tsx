import { useState, useRef, useCallback, useEffect } from 'react';

interface WebTerminalProps {
  open: boolean;
  onClose: () => void;
}

interface TerminalEntry {
  id: number;
  command: string;
  output: string;
}

interface K8sListResponse {
  items: K8sResource[];
}

interface K8sResource {
  metadata: {
    name: string;
    namespace?: string;
    creationTimestamp?: string;
  };
  status?: {
    phase?: string;
    conditions?: { type: string; status: string }[];
    addresses?: { address: string }[];
    nodeInfo?: { kubeletVersion?: string; osImage?: string };
  };
  spec?: {
    clusterIP?: string;
    type?: string;
    ports?: { port: number; targetPort: number | string; protocol: string }[];
  };
}

interface K8sVersionResponse {
  major: string;
  minor: string;
  gitVersion: string;
  platform: string;
}

interface K8sUserResponse {
  metadata: {
    name: string;
  };
  groups?: string[];
}

function padRight(str: string, len: number): string {
  if (str.length >= len) return str;
  return str + ' '.repeat(len - str.length);
}

function formatTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) => {
    const maxRow = rows.reduce((max, row) => Math.max(max, (row[i] ?? '').length), 0);
    return Math.max(h.length, maxRow) + 2;
  });

  const headerLine = headers.map((h, i) => padRight(h, colWidths[i])).join('');
  const rowLines = rows.map((row) =>
    row.map((cell, i) => padRight(cell, colWidths[i])).join('')
  );

  return [headerLine, ...rowLines].join('\n');
}

function getNodeStatus(resource: K8sResource): string {
  const readyCondition = resource.status?.conditions?.find((c) => c.type === 'Ready');
  if (readyCondition) {
    return readyCondition.status === 'True' ? 'Ready' : 'NotReady';
  }
  return 'Unknown';
}

async function handleGetPods(): Promise<string> {
  const res = await fetch('/api/kubernetes/api/v1/pods');
  const data = await res.json() as K8sListResponse;
  if (!data.items || data.items.length === 0) return 'No resources found.';

  const headers = ['NAME', 'NAMESPACE', 'STATUS'];
  const rows = data.items.map((item) => [
    item.metadata.name,
    item.metadata.namespace ?? '-',
    item.status?.phase ?? 'Unknown',
  ]);
  return formatTable(headers, rows);
}

async function handleGetNodes(): Promise<string> {
  const res = await fetch('/api/kubernetes/api/v1/nodes');
  const data = await res.json() as K8sListResponse;
  if (!data.items || data.items.length === 0) return 'No resources found.';

  const headers = ['NAME', 'STATUS', 'VERSION'];
  const rows = data.items.map((item) => [
    item.metadata.name,
    getNodeStatus(item),
    item.status?.nodeInfo?.kubeletVersion ?? '-',
  ]);
  return formatTable(headers, rows);
}

async function handleGetDeployments(): Promise<string> {
  const res = await fetch('/api/kubernetes/apis/apps/v1/deployments');
  const data = await res.json() as K8sListResponse;
  if (!data.items || data.items.length === 0) return 'No resources found.';

  const headers = ['NAME', 'NAMESPACE'];
  const rows = data.items.map((item) => [
    item.metadata.name,
    item.metadata.namespace ?? '-',
  ]);
  return formatTable(headers, rows);
}

async function handleGetNamespaces(): Promise<string> {
  const res = await fetch('/api/kubernetes/api/v1/namespaces');
  const data = await res.json() as K8sListResponse;
  if (!data.items || data.items.length === 0) return 'No resources found.';

  const headers = ['NAME', 'STATUS'];
  const rows = data.items.map((item) => [
    item.metadata.name,
    item.status?.phase ?? 'Unknown',
  ]);
  return formatTable(headers, rows);
}

async function handleGetServices(): Promise<string> {
  const res = await fetch('/api/kubernetes/api/v1/services');
  const data = await res.json() as K8sListResponse;
  if (!data.items || data.items.length === 0) return 'No resources found.';

  const headers = ['NAME', 'NAMESPACE', 'TYPE', 'CLUSTER-IP'];
  const rows = data.items.map((item) => [
    item.metadata.name,
    item.metadata.namespace ?? '-',
    item.spec?.type ?? '-',
    item.spec?.clusterIP ?? '-',
  ]);
  return formatTable(headers, rows);
}

async function handleWhoami(): Promise<string> {
  const res = await fetch('/api/kubernetes/apis/user.openshift.io/v1/users/~');
  const data = await res.json() as K8sUserResponse;
  return data.metadata.name;
}

async function handleVersion(): Promise<string> {
  const res = await fetch('/api/kubernetes/version');
  const data = await res.json() as K8sVersionResponse;
  return `Server Version: ${data.gitVersion}\nPlatform: ${data.platform}`;
}

function showHelp(): string {
  return [
    'Available commands:',
    '  get pods          - List all pods',
    '  get nodes         - List all nodes',
    '  get deployments   - List all deployments',
    '  get namespaces    - List all namespaces',
    '  get services      - List all services',
    '  whoami            - Show current user',
    '  version           - Show server version',
    '  help              - Show this help message',
    '  clear             - Clear terminal',
    '',
    'Commands can be prefixed with "kubectl" (e.g., "kubectl get pods").',
  ].join('\n');
}

async function executeCommand(rawCmd: string): Promise<string> {
  // Strip leading "kubectl " if present
  const cmd = rawCmd.replace(/^kubectl\s+/, '').trim();

  switch (cmd) {
    case 'get pods':
    case 'get pod':
    case 'get po':
      return handleGetPods();
    case 'get nodes':
    case 'get node':
    case 'get no':
      return handleGetNodes();
    case 'get deployments':
    case 'get deployment':
    case 'get deploy':
      return handleGetDeployments();
    case 'get namespaces':
    case 'get namespace':
    case 'get ns':
      return handleGetNamespaces();
    case 'get services':
    case 'get service':
    case 'get svc':
      return handleGetServices();
    case 'whoami':
      return handleWhoami();
    case 'version':
      return handleVersion();
    case 'help':
      return showHelp();
    default:
      return 'Unknown command. Type \'help\' for available commands.';
  }
}

const WebTerminal: React.FC<WebTerminalProps> = ({ open, onClose }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TerminalEntry[]>([]);
  const [nextId, setNextId] = useState(0);
  const [executing, setExecuting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const cmd = input.trim();
    if (!cmd) return;

    if (cmd === 'clear') {
      setHistory([]);
      setInput('');
      return;
    }

    setExecuting(true);
    setInput('');

    let output: string;
    try {
      output = await executeCommand(cmd);
    } catch (err) {
      output = `Error: ${err instanceof Error ? err.message : String(err)}`;
    }

    const entry: TerminalEntry = {
      id: nextId,
      command: cmd,
      output,
    };

    setHistory((prev) => [...prev, entry]);
    setNextId((n) => n + 1);
    setExecuting(false);
  }, [input, nextId]);

  if (!open) return null;

  return (
    <div className="compass-log-viewer compass-web-terminal">
      <div className="compass-log-viewer__toolbar">
        <span className="compass-log-viewer__toolbar-title">Terminal</span>
        <button
          type="button"
          className="compass-deploy-close"
          aria-label="Close terminal"
          onClick={onClose}
        >
          &#x2715;
        </button>
      </div>
      <div
        ref={contentRef}
        className="compass-log-viewer__content"
        onClick={() => inputRef.current?.focus()}
        role="log"
      >
        {history.map((entry) => (
          <div key={entry.id}>
            <div className="compass-log-line">
              <span className="compass-log-line-content">$ {entry.command}</span>
            </div>
            <div className="compass-log-line">
              <span className="compass-log-line-content">{entry.output}</span>
            </div>
          </div>
        ))}
        <div className="compass-log-line">
          <span className="compass-log-line-content">
            ${' '}
            <input
              ref={inputRef}
              type="text"
              className="compass-web-terminal__input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleSubmit}
              aria-label="Terminal input"
              autoComplete="off"
              spellCheck={false}
              disabled={executing}
            />
          </span>
        </div>
      </div>
    </div>
  );
};

export default WebTerminal;
