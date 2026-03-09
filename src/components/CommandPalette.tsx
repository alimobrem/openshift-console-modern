import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';

interface CommandItem {
  id: string;
  label: string;
  section: string;
  href?: string;
  action?: () => void;
  shortcut?: string;
}

const navigationItems: CommandItem[] = [
  { id: 'overview', label: 'Overview', section: 'Home', href: '/home/overview' },
  { id: 'search', label: 'Search', section: 'Home', href: '/home/search' },
  { id: 'events', label: 'Events', section: 'Home', href: '/home/events' },
  { id: 'pods', label: 'Pods', section: 'Workloads', href: '/workloads/pods', shortcut: 'G P' },
  { id: 'deployments', label: 'Deployments', section: 'Workloads', href: '/workloads/deployments', shortcut: 'G D' },
  { id: 'statefulsets', label: 'StatefulSets', section: 'Workloads', href: '/workloads/statefulsets' },
  { id: 'daemonsets', label: 'DaemonSets', section: 'Workloads', href: '/workloads/daemonsets' },
  { id: 'jobs', label: 'Jobs', section: 'Workloads', href: '/workloads/jobs' },
  { id: 'cronjobs', label: 'CronJobs', section: 'Workloads', href: '/workloads/cronjobs' },
  { id: 'secrets', label: 'Secrets', section: 'Workloads', href: '/workloads/secrets' },
  { id: 'configmaps', label: 'ConfigMaps', section: 'Workloads', href: '/workloads/configmaps' },
  { id: 'services', label: 'Services', section: 'Networking', href: '/networking/services' },
  { id: 'routes', label: 'Routes', section: 'Networking', href: '/networking/routes' },
  { id: 'ingress', label: 'Ingress', section: 'Networking', href: '/networking/ingress' },
  { id: 'networkpolicies', label: 'Network Policies', section: 'Networking', href: '/networking/networkpolicies' },
  { id: 'pv', label: 'Persistent Volumes', section: 'Storage', href: '/storage/persistentvolumes' },
  { id: 'pvc', label: 'Persistent Volume Claims', section: 'Storage', href: '/storage/persistentvolumeclaims' },
  { id: 'sc', label: 'Storage Classes', section: 'Storage', href: '/storage/storageclasses' },
  { id: 'nodes', label: 'Nodes', section: 'Compute', href: '/compute/nodes', shortcut: 'G N' },
  { id: 'machines', label: 'Machines', section: 'Compute', href: '/compute/machines' },
  { id: 'namespaces', label: 'Namespaces', section: 'Administration', href: '/administration/namespaces' },
  { id: 'cluster-settings', label: 'Cluster Settings', section: 'Administration', href: '/administration/cluster-settings' },
];

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function CommandPalette() {
  const navigate = useNavigate();
  const { commandPaletteOpen, closeCommandPalette } = useUIStore();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = query
    ? navigationItems.filter(
        (item) => fuzzyMatch(query, item.label) || fuzzyMatch(query, item.section)
      )
    : navigationItems;

  React.useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const execute = (item: CommandItem) => {
    if (item.href) navigate(item.href);
    if (item.action) item.action();
    closeCommandPalette();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      execute(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      closeCommandPalette();
    }
  };

  if (!commandPaletteOpen) return null;

  // Group by section
  const sections = new Map<string, CommandItem[]>();
  filtered.forEach((item) => {
    const list = sections.get(item.section) ?? [];
    list.push(item);
    sections.set(item.section, list);
  });

  let globalIndex = 0;

  return (
    <div className="compass-command-palette-overlay" onClick={closeCommandPalette}>
      <div className="compass-command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="compass-command-palette__input-wrapper">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="os-command-palette__search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className="compass-command-palette__input"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="compass-command-palette__kbd">ESC</kbd>
        </div>
        <div className="compass-command-palette__results">
          {filtered.length === 0 ? (
            <div className="compass-command-palette__empty">No results found</div>
          ) : (
            Array.from(sections.entries()).map(([section, items]) => (
              <div key={section}>
                <div className="compass-command-palette__section">{section}</div>
                {items.map((item) => {
                  const idx = globalIndex++;
                  return (
                    <div
                      key={item.id}
                      className={`compass-command-palette__item ${idx === selectedIndex ? 'compass-command-palette__item--selected' : ''}`}
                      onClick={() => execute(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <kbd className="compass-command-palette__shortcut">{item.shortcut}</kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
