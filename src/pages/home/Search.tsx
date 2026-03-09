import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  Select,
  SelectOption,
  MenuToggle,
  Label,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { SearchIcon } from '@patternfly/react-icons';

interface SearchResult {
  name: string;
  kind: string;
  namespace: string;
  status: string;
  created: string;
}

const allResources: SearchResult[] = [
  { name: 'frontend', kind: 'Pod', namespace: 'default', status: 'Running', created: '2d' },
  { name: 'backend-api', kind: 'Deployment', namespace: 'default', status: 'Available', created: '25d' },
  { name: 'database', kind: 'Service', namespace: 'database', status: 'Active', created: '60d' },
  { name: 'master-0', kind: 'Node', namespace: '-', status: 'Ready', created: '120d' },
  { name: 'data-pvc', kind: 'PersistentVolumeClaim', namespace: 'default', status: 'Bound', created: '60d' },
  { name: 'mongodb', kind: 'StatefulSet', namespace: 'default', status: 'Running', created: '15d' },
  { name: 'frontend', kind: 'Route', namespace: 'default', status: 'Admitted', created: '30d' },
  { name: 'database-credentials', kind: 'Secret', namespace: 'default', status: '-', created: '60d' },
  { name: 'app-config', kind: 'ConfigMap', namespace: 'default', status: '-', created: '60d' },
  { name: 'backup-daily', kind: 'CronJob', namespace: 'default', status: 'Active', created: '90d' },
];

export default function Search() {
  const [searchValue, setSearchValue] = React.useState('');
  const [resourceFilter, setResourceFilter] = React.useState('All Resources');
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);

  const resourceTypes = [
    'All Resources',
    'Pods',
    'Deployments',
    'Services',
    'Nodes',
    'PersistentVolumeClaims',
    'StatefulSets',
    'Routes',
    'Secrets',
    'ConfigMaps',
    'CronJobs',
  ];

  const filteredResults = allResources.filter((resource) => {
    const matchesSearch =
      resource.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      resource.kind.toLowerCase().includes(searchValue.toLowerCase()) ||
      resource.namespace.toLowerCase().includes(searchValue.toLowerCase());

    const matchesFilter =
      resourceFilter === 'All Resources' ||
      (resourceFilter.endsWith('s') && resource.kind === resourceFilter.slice(0, -1)) ||
      resource.kind === resourceFilter;

    return matchesSearch && matchesFilter;
  });

  const getKindColor = (kind: string) => {
    const colors: { [key: string]: string } = {
      Pod: 'blue',
      Deployment: 'purple',
      Service: 'cyan',
      Node: 'orange',
      PersistentVolumeClaim: 'green',
      StatefulSet: 'purple',
      Route: 'cyan',
      Secret: 'grey',
      ConfigMap: 'grey',
      CronJob: 'blue',
    };
    return colors[kind] || 'grey';
  };

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Search
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Search and discover all resources across your cluster
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="search-toolbar">
              <ToolbarContent>
                <ToolbarItem variant="search-filter" style={{ flexGrow: 1 }}>
                  <SearchInput
                    placeholder="Search resources by name, kind, or namespace..."
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Select
                    id="resource-type-select"
                    isOpen={isSelectOpen}
                    selected={resourceFilter}
                    onSelect={(_event, selection) => {
                      setResourceFilter(selection as string);
                      setIsSelectOpen(false);
                    }}
                    onOpenChange={(isOpen) => setIsSelectOpen(isOpen)}
                    toggle={(toggleRef) => (
                      <MenuToggle ref={toggleRef} onClick={() => setIsSelectOpen(!isSelectOpen)}>
                        {resourceFilter}
                      </MenuToggle>
                    )}
                  >
                    {resourceTypes.map((type) => (
                      <SelectOption key={type} value={type}>
                        {type}
                      </SelectOption>
                    ))}
                  </Select>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Search results table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Kind</Th>
                  <Th>Namespace</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredResults.length > 0 ? (
                  filteredResults.map((resource, idx) => (
                    <Tr key={`${resource.kind}-${resource.namespace}-${resource.name}-${idx}`}>
                      <Td dataLabel="Name">
                        <strong>{resource.name}</strong>
                      </Td>
                      <Td dataLabel="Kind">
                        <Label color={getKindColor(resource.kind)}>{resource.kind}</Label>
                      </Td>
                      <Td dataLabel="Namespace">
                        {resource.namespace === '-' ? (
                          <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>-</span>
                        ) : (
                          resource.namespace
                        )}
                      </Td>
                      <Td dataLabel="Status">{resource.status}</Td>
                      <Td dataLabel="Created">{resource.created}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                      <SearchIcon size="lg" style={{ marginBottom: '12px', color: 'var(--pf-v6-global--Color--200)' }} />
                      <div>
                        {searchValue
                          ? `No resources found matching "${searchValue}"`
                          : 'Enter a search term to find resources'}
                      </div>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
}
