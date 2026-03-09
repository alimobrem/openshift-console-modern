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
  Button,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { PlusCircleIcon } from '@patternfly/react-icons';

interface ConfigMap {
  name: string;
  namespace: string;
  dataKeys: number;
  age: string;
}

const mockConfigMaps: ConfigMap[] = [
  {
    name: 'app-config',
    namespace: 'default',
    dataKeys: 5,
    age: '60d',
  },
  {
    name: 'nginx-config',
    namespace: 'default',
    dataKeys: 2,
    age: '45d',
  },
  {
    name: 'database-init-scripts',
    namespace: 'database',
    dataKeys: 3,
    age: '90d',
  },
  {
    name: 'environment-vars',
    namespace: 'default',
    dataKeys: 12,
    age: '30d',
  },
  {
    name: 'logging-config',
    namespace: 'logging',
    dataKeys: 4,
    age: '75d',
  },
  {
    name: 'prometheus-config',
    namespace: 'monitoring',
    dataKeys: 1,
    age: '120d',
  },
];

export default function ConfigMaps() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredConfigMaps = mockConfigMaps.filter(
    (cm) =>
      cm.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      cm.namespace.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          ConfigMaps
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage configuration data for applications
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="configmaps-toolbar">
              <ToolbarContent>
                <ToolbarItem variant="search-filter">
                  <SearchInput
                    placeholder="Search by name or namespace"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="primary" icon={<PlusCircleIcon />}>
                    Create ConfigMap
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="ConfigMaps table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Data Keys</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredConfigMaps.length > 0 ? (
                  filteredConfigMaps.map((cm) => (
                    <Tr key={`${cm.namespace}-${cm.name}`}>
                      <Td dataLabel="Name">
                        <strong>{cm.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{cm.namespace}</Td>
                      <Td dataLabel="Data Keys">{cm.dataKeys}</Td>
                      <Td dataLabel="Age">{cm.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={4} style={{ textAlign: 'center' }}>
                      {searchValue ? 'No ConfigMaps found matching your search' : 'No ConfigMaps found'}
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
