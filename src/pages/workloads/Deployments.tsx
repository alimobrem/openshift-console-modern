import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import { MinusIcon, PlusIcon } from '@patternfly/react-icons';
import ResourceListPage, { type ColumnDef } from '@/components/ResourceListPage';
import { useClusterStore, type Deployment } from '@/store/useClusterStore';
import { useUIStore } from '@/store/useUIStore';
import '@/openshift-components.css';

function ScaleInline({ deployment }: { deployment: Deployment }) {
  const scaleDeployment = useClusterStore((s) => s.scaleDeployment);
  const addToast = useUIStore((s) => s.addToast);

  const handleScale = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = Math.max(0, deployment.replicas + delta);
    scaleDeployment(deployment.namespace, deployment.name, next);
    addToast({ type: 'success', title: `Scaled ${deployment.name}`, description: `Replicas set to ${next}` });
  };

  return (
    <span className="os-deployments__scale-inline" onClick={(e) => e.stopPropagation()}>
      <Button variant="plain" size="sm" isDisabled={deployment.replicas <= 0} onClick={(e) => handleScale(-1, e)} aria-label="Scale down" className="os-deployments__scale-btn">
        <MinusIcon />
      </Button>
      <span className="os-deployments__scale-value">{deployment.ready}/{deployment.replicas}</span>
      <Button variant="plain" size="sm" onClick={(e) => handleScale(1, e)} aria-label="Scale up" className="os-deployments__scale-btn">
        <PlusIcon />
      </Button>
    </span>
  );
}

const columns: ColumnDef<Deployment>[] = [
  { title: 'Name', key: 'name' },
  { title: 'Namespace', key: 'namespace' },
  { title: 'Status', key: 'status' },
  { title: 'Replicas', key: 'replicas', render: (d) => <ScaleInline deployment={d} />, sortable: false },
];

export default function Deployments() {
  const navigate = useNavigate();
  const { deployments, fetchClusterData } = useClusterStore();

  useEffect(() => { fetchClusterData(); }, [fetchClusterData]);

  return (
    <ResourceListPage
      title="Deployments"
      description="Manage deployment resources across your cluster"
      columns={columns}
      data={deployments}
      getRowKey={(d) => `${d.namespace}-${d.name}`}
      onRowClick={(d) => navigate(`/workloads/deployments/${d.namespace}/${d.name}`)}
      createLabel="Create Deployment"
      statusField="status"
      nameField="name"
      filterFn={(d, s) => d.name.toLowerCase().includes(s.toLowerCase()) || d.namespace.toLowerCase().includes(s.toLowerCase())}
    />
  );
}
