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
  Label,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { PlusCircleIcon } from '@patternfly/react-icons';

interface StatefulSet {
  name: string;
  namespace: string;
  replicas: string;
  ready: number;
  age: string;
}

const mockStatefulSets: StatefulSet[] = [
  { name: 'mongodb', namespace: 'default', replicas: '3/3', ready: 3, age: '15d' },
  { name: 'elasticsearch', namespace: 'logging', replicas: '3/3', ready: 3, age: '30d' },
  { name: 'kafka', namespace: 'messaging', replicas: '5/5', ready: 5, age: '45d' },
  { name: 'redis-cluster', namespace: 'cache', replicas: '6/6', ready: 6, age: '20d' },
  { name: 'cassandra', namespace: 'database', replicas: '3/3', ready: 3, age: '60d' },
  { name: 'zookeeper', namespace: 'messaging', replicas: '3/3', ready: 3, age: '45d' },
];

export default function StatefulSets() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredStatefulSets = mockStatefulSets.filter(
    (sts) =>
      sts.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      sts.namespace.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getStatusColor = (replicas: string) => {
    const [current, desired] = replicas.split('/').map(Number);
    if (current === desired) return 'green';
    if (current === 0) return 'red';
    return 'orange';
  };

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          StatefulSets
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage stateful applications with persistent storage
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="statefulsets-toolbar">
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
                    Create StatefulSet
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="StatefulSets table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Replicas</Th>
                  <Th>Ready</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredStatefulSets.length > 0 ? (
                  filteredStatefulSets.map((sts) => (
                    <Tr key={`${sts.namespace}-${sts.name}`}>
                      <Td dataLabel="Name">
                        <strong>{sts.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{sts.namespace}</Td>
                      <Td dataLabel="Replicas">
                        <Label color={getStatusColor(sts.replicas)}>{sts.replicas}</Label>
                      </Td>
                      <Td dataLabel="Ready">{sts.ready}</Td>
                      <Td dataLabel="Age">{sts.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={5} style={{ textAlign: 'center' }}>
                      {searchValue
                        ? 'No StatefulSets found matching your search'
                        : 'No StatefulSets found'}
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
