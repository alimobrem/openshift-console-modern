import ResourceListPage, { type ColumnDef } from '@/components/ResourceListPage';
import { useK8sResource, ageFromTimestamp, type K8sMeta } from '@/hooks/useK8sResource';
import { Label } from '@patternfly/react-core';

interface BuildConfig {
  name: string;
  namespace: string;
  type: string;
  gitRepo: string;
  lastBuild: string;
  status: string;
  age: string;
}

interface RawBuildConfig extends K8sMeta {
  spec: {
    strategy: { type: string };
    source?: { git?: { uri: string } };
  };
  status: {
    lastVersion?: number;
  };
}

const typeColors: Record<string, 'blue' | 'teal' | 'purple' | 'orange'> = {
  Source: 'blue',
  Docker: 'teal',
  Custom: 'purple',
  JenkinsPipeline: 'orange',
};

const columns: ColumnDef<BuildConfig>[] = [
  { title: 'Name', key: 'name' },
  { title: 'Namespace', key: 'namespace' },
  { title: 'Type', key: 'type', render: (bc) => <Label color={typeColors[bc.type] ?? 'grey'}>{bc.type}</Label> },
  { title: 'Git Repository', key: 'gitRepo', render: (bc) => <code>{bc.gitRepo}</code> },
  { title: 'Last Build', key: 'lastBuild' },
  { title: 'Status', key: 'status' },
  { title: 'Age', key: 'age' },
];

export default function BuildConfigs() {
  const { data, loading } = useK8sResource<RawBuildConfig, BuildConfig>(
    '/apis/build.openshift.io/v1/buildconfigs',
    (item) => ({
      name: item.metadata.name,
      namespace: item.metadata.namespace ?? '',
      type: item.spec.strategy.type,
      gitRepo: item.spec.source?.git?.uri ?? '-',
      lastBuild: item.status.lastVersion ? `#${item.status.lastVersion}` : '-',
      status: '-',
      age: ageFromTimestamp(item.metadata.creationTimestamp),
    }),
  );

  return (
    <ResourceListPage
      title="Build Configs"
      description="Manage build configuration templates"
      columns={columns}
      data={data}
      loading={loading}
      getRowKey={(bc) => `${bc.namespace}-${bc.name}`}
      createLabel="Create Build Config"
      statusField="status"
      nameField="name"
    />
  );
}
