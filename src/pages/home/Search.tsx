import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ResourceListPage, { type ColumnDef } from '@/components/ResourceListPage';
import { Label, ToolbarItem, Select, SelectOption, MenuToggle } from '@patternfly/react-core';
import { useClusterStore } from '@/store/useClusterStore';
import '@/openshift-components.css';

interface SearchResult {
  name: string;
  kind: string;
  namespace: string;
  status: string;
  created: string;
}

const kindColors: Record<string, 'blue' | 'purple' | 'teal' | 'orange' | 'green' | 'grey'> = {
  Pod: 'blue',
  Deployment: 'purple',
  Service: 'teal',
  Node: 'orange',
  PersistentVolume: 'green',
  Namespace: 'grey',
};

const kindRoutes: Record<string, string> = {
  Pod: '/workloads/pods',
  Deployment: '/workloads/deployments',
  Service: '/networking/services',
  Node: '/compute/nodes',
};

const resourceTypes = ['All Resources', 'Pods', 'Deployments', 'Services', 'Nodes', 'Namespaces', 'PersistentVolumes'];

const columns: ColumnDef<SearchResult>[] = [
  { title: 'Name', key: 'name' },
  { title: 'Kind', key: 'kind', render: (r) => <Label color={kindColors[r.kind] ?? 'grey'}>{r.kind}</Label> },
  { title: 'Namespace', key: 'namespace', render: (r) => r.namespace === '-' ? <span className="os-search__ns-empty">-</span> : r.namespace },
  { title: 'Status', key: 'status' },
  { title: 'Created', key: 'created' },
];

export default function Search() {
  const navigate = useNavigate();
  const { pods, deployments, services, nodes, namespaces, persistentVolumes } = useClusterStore();
  const [resourceFilter, setResourceFilter] = React.useState('All Resources');
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);

  const allResources = useMemo<SearchResult[]>(() => [
    ...pods.map((p) => ({ name: p.name, kind: 'Pod', namespace: p.namespace, status: p.status, created: '-' })),
    ...deployments.map((d) => ({ name: d.name, kind: 'Deployment', namespace: d.namespace, status: d.status, created: '-' })),
    ...services.map((s) => ({ name: s.name, kind: 'Service', namespace: s.namespace, status: s.type, created: '-' })),
    ...nodes.map((n) => ({ name: n.name, kind: 'Node', namespace: '-', status: n.status, created: '-' })),
    ...namespaces.map((ns) => ({ name: ns.name, kind: 'Namespace', namespace: '-', status: ns.status, created: ns.age })),
    ...persistentVolumes.map((pv) => ({ name: pv.name, kind: 'PersistentVolume', namespace: '-', status: pv.status, created: '-' })),
  ], [pods, deployments, services, nodes, namespaces, persistentVolumes]);

  const filtered = resourceFilter === 'All Resources'
    ? allResources
    : allResources.filter((r) => {
        const singular = resourceFilter.endsWith('s') ? resourceFilter.slice(0, -1) : resourceFilter;
        return r.kind === singular || r.kind === resourceFilter;
      });

  const handleRowClick = (r: SearchResult) => {
    const base = kindRoutes[r.kind];
    if (base && r.kind === 'Node') {
      navigate(`${base}/${r.name}`);
    } else if (base) {
      navigate(base);
    }
  };

  return (
    <ResourceListPage
      title="Search"
      description="Search and discover all resources across your cluster"
      columns={columns}
      data={filtered}
      getRowKey={(r) => `${r.kind}-${r.namespace}-${r.name}`}
      onRowClick={handleRowClick}
      nameField="name"
      filterFn={(r, s) => {
        const q = s.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.kind.toLowerCase().includes(q) || r.namespace.toLowerCase().includes(q);
      }}
      toolbarExtra={
        <ToolbarItem>
          <Select
            id="resource-type-select"
            isOpen={isSelectOpen}
            selected={resourceFilter}
            onSelect={(_event, selection) => { setResourceFilter(selection as string); setIsSelectOpen(false); }}
            onOpenChange={(isOpen) => setIsSelectOpen(isOpen)}
            toggle={(toggleRef) => (
              <MenuToggle ref={toggleRef} onClick={() => setIsSelectOpen(!isSelectOpen)}>
                {resourceFilter}
              </MenuToggle>
            )}
          >
            {resourceTypes.map((type) => (
              <SelectOption key={type} value={type}>{type}</SelectOption>
            ))}
          </Select>
        </ToolbarItem>
      }
    />
  );
}
