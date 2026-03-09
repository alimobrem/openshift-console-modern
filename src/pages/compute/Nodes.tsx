import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResourceListPage, { type ColumnDef } from '@/components/ResourceListPage';
import { useClusterStore, type Node } from '@/store/useClusterStore';
import { Progress, ProgressVariant } from '@patternfly/react-core';

const columns: ColumnDef<Node>[] = [
  { title: 'Name', key: 'name' },
  { title: 'Status', key: 'status' },
  { title: 'Role', key: 'role' },
  { title: 'CPU Usage', key: 'cpu', render: (n) => (
    <div className="os-nodes__usage-cell">
      <Progress
        value={n.cpu}
        title=""
        size="sm"
        variant={n.cpu > 80 ? ProgressVariant.danger : n.cpu > 60 ? ProgressVariant.warning : ProgressVariant.success}
      />
      <span className="os-nodes__usage-value">{n.cpu}%</span>
    </div>
  ), sortable: false },
  { title: 'Memory Usage', key: 'memory', render: (n) => (
    <div className="os-nodes__usage-cell">
      <Progress
        value={n.memory}
        title=""
        size="sm"
        variant={n.memory > 80 ? ProgressVariant.danger : n.memory > 60 ? ProgressVariant.warning : ProgressVariant.success}
      />
      <span className="os-nodes__usage-value">{n.memory}%</span>
    </div>
  ), sortable: false },
  { title: 'Version', key: 'version' },
];

export default function Nodes() {
  const navigate = useNavigate();
  const { nodes, fetchClusterData } = useClusterStore();

  useEffect(() => { fetchClusterData(); }, [fetchClusterData]);

  return (
    <ResourceListPage
      title="Nodes"
      description="View and manage cluster compute nodes"
      columns={columns}
      data={nodes}
      getRowKey={(n) => n.name}
      onRowClick={(n) => navigate(`/compute/nodes/${n.name}`)}
      statusField="status"
      nameField="name"
    />
  );
}
