import ResourceListPage, { type ColumnDef } from '@/components/ResourceListPage';
import { useK8sResource, ageFromTimestamp, type K8sMeta } from '@/hooks/useK8sResource';
import StatusIndicator from '@/components/StatusIndicator';

interface ClusterOperator {
  name: string;
  version: string;
  status: string;
  message: string;
  age: string;
}

interface RawClusterOperatorCondition {
  type: string;
  status: string;
  message?: string;
}

interface RawClusterOperator extends K8sMeta {
  status?: {
    versions?: { version: string }[];
    conditions?: RawClusterOperatorCondition[];
  };
}

function deriveStatus(conditions: RawClusterOperatorCondition[] | undefined): { status: string; message: string } {
  if (!conditions) return { status: 'Unknown', message: '-' };
  const degraded = conditions.find((c) => c.type === 'Degraded' && c.status === 'True');
  if (degraded) return { status: 'Degraded', message: degraded.message ?? 'Degraded' };
  const progressing = conditions.find((c) => c.type === 'Progressing' && c.status === 'True');
  if (progressing) return { status: 'Progressing', message: progressing.message ?? 'Progressing' };
  const available = conditions.find((c) => c.type === 'Available');
  if (available?.status === 'True') return { status: 'Available', message: available.message ?? 'Available' };
  return { status: 'Unknown', message: '-' };
}

const columns: ColumnDef<ClusterOperator>[] = [
  { title: 'Name', key: 'name' },
  { title: 'Version', key: 'version' },
  {
    title: 'Status',
    key: 'status',
    render: (op) => <StatusIndicator status={op.status} />,
  },
  { title: 'Message', key: 'message' },
  { title: 'Age', key: 'age' },
];

export default function ClusterOperators() {
  const { data, loading } = useK8sResource<RawClusterOperator, ClusterOperator>(
    '/apis/config.openshift.io/v1/clusteroperators',
    (item) => {
      const { status, message } = deriveStatus(item.status?.conditions);
      return {
        name: item.metadata.name,
        version: item.status?.versions?.[0]?.version ?? '-',
        status,
        message,
        age: ageFromTimestamp(item.metadata.creationTimestamp),
      };
    },
  );

  return (
    <ResourceListPage
      title="Cluster Operators"
      description="View the status of cluster operators managing OpenShift components"
      columns={columns}
      data={data}
      loading={loading}
      getRowKey={(op) => op.name}
      nameField="name"
    />
  );
}
