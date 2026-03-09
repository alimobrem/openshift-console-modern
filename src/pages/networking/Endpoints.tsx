import ResourceListPage, { type ColumnDef } from '@/components/ResourceListPage';
import { useK8sResource, ageFromTimestamp, type K8sMeta } from '@/hooks/useK8sResource';

interface Endpoint {
  name: string;
  namespace: string;
  addresses: string;
  ports: string;
  age: string;
}

interface RawEndpointPort {
  port: number;
  protocol?: string;
}

interface RawEndpointAddress {
  ip: string;
}

interface RawEndpoints extends K8sMeta {
  subsets?: {
    addresses?: RawEndpointAddress[];
    ports?: RawEndpointPort[];
  }[];
}

const columns: ColumnDef<Endpoint>[] = [
  { title: 'Name', key: 'name' },
  { title: 'Namespace', key: 'namespace' },
  { title: 'Addresses', key: 'addresses' },
  { title: 'Ports', key: 'ports' },
  { title: 'Age', key: 'age' },
];

export default function Endpoints() {
  const { data, loading } = useK8sResource<RawEndpoints, Endpoint>(
    '/api/v1/endpoints',
    (item) => {
      const subset = item.subsets?.[0];
      const addresses = (subset?.addresses ?? []).map((a) => a.ip).join(', ') || '<none>';
      const ports = (subset?.ports ?? [])
        .map((p) => `${p.port}/${p.protocol ?? 'TCP'}`)
        .join(', ') || '<none>';
      return {
        name: item.metadata.name,
        namespace: item.metadata.namespace ?? '',
        addresses,
        ports,
        age: ageFromTimestamp(item.metadata.creationTimestamp),
      };
    },
  );

  return (
    <ResourceListPage
      title="Endpoints"
      description="View endpoint addresses backing services in the cluster"
      columns={columns}
      data={data}
      loading={loading}
      getRowKey={(ep) => `${ep.namespace}-${ep.name}`}
      nameField="name"
    />
  );
}
