import ResourceListPage, { type ColumnDef } from '@/components/ResourceListPage';
import { useK8sResource, ageFromTimestamp, type K8sMeta } from '@/hooks/useK8sResource';

interface PVC {
  name: string;
  namespace: string;
  status: string;
  volume: string;
  capacity: string;
  accessModes: string;
  storageClass: string;
  age: string;
}

interface RawPVC extends K8sMeta {
  spec: {
    storageClassName?: string;
    resources?: { requests?: { storage?: string } };
    volumeName?: string;
    accessModes?: string[];
  };
  status: { phase?: string };
}

const accessModeShort: Record<string, string> = {
  ReadWriteOnce: 'RWO',
  ReadOnlyMany: 'ROX',
  ReadWriteMany: 'RWX',
  ReadWriteOncePod: 'RWOP',
};

const columns: ColumnDef<PVC>[] = [
  { title: 'Name', key: 'name' },
  { title: 'Namespace', key: 'namespace' },
  { title: 'Status', key: 'status' },
  { title: 'Volume', key: 'volume' },
  { title: 'Capacity', key: 'capacity' },
  { title: 'Access Modes', key: 'accessModes' },
  { title: 'Storage Class', key: 'storageClass' },
  { title: 'Age', key: 'age' },
];

export default function PersistentVolumeClaims() {
  const { data, loading } = useK8sResource<RawPVC, PVC>(
    '/api/v1/persistentvolumeclaims',
    (item) => ({
      name: item.metadata.name,
      namespace: item.metadata.namespace ?? '',
      status: item.status.phase ?? '-',
      volume: item.spec.volumeName ?? '-',
      capacity: item.spec.resources?.requests?.storage ?? '-',
      accessModes: (item.spec.accessModes ?? []).map((m) => accessModeShort[m] ?? m).join(', '),
      storageClass: item.spec.storageClassName ?? '-',
      age: ageFromTimestamp(item.metadata.creationTimestamp),
    }),
  );

  return (
    <ResourceListPage
      title="Persistent Volume Claims"
      description="Manage storage claims for your workloads"
      columns={columns}
      data={data}
      loading={loading}
      getRowKey={(pvc) => `${pvc.namespace}-${pvc.name}`}
      createLabel="Create PVC"
      statusField="status"
      nameField="name"
    />
  );
}
