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

interface DaemonSet {
  name: string;
  namespace: string;
  desired: number;
  current: number;
  ready: number;
  upToDate: number;
  available: number;
  age: string;
}

const mockDaemonSets: DaemonSet[] = [
  {
    name: 'fluentd',
    namespace: 'kube-system',
    desired: 3,
    current: 3,
    ready: 3,
    upToDate: 3,
    available: 3,
    age: '90d',
  },
  {
    name: 'node-exporter',
    namespace: 'monitoring',
    desired: 3,
    current: 3,
    ready: 3,
    upToDate: 3,
    available: 3,
    age: '75d',
  },
  {
    name: 'kube-proxy',
    namespace: 'kube-system',
    desired: 3,
    current: 3,
    ready: 3,
    upToDate: 3,
    available: 3,
    age: '120d',
  },
  {
    name: 'calico-node',
    namespace: 'kube-system',
    desired: 3,
    current: 3,
    ready: 3,
    upToDate: 3,
    available: 3,
    age: '120d',
  },
];

export default function DaemonSets() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredDaemonSets = mockDaemonSets.filter(
    (ds) =>
      ds.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      ds.namespace.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getStatusColor = (ds: DaemonSet) => {
    if (ds.ready === ds.desired && ds.available === ds.desired) return 'green';
    if (ds.ready === 0) return 'red';
    return 'orange';
  };

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          DaemonSets
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Ensure pods run on all cluster nodes
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="daemonsets-toolbar">
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
                    Create DaemonSet
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="DaemonSets table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Status</Th>
                  <Th>Desired</Th>
                  <Th>Current</Th>
                  <Th>Ready</Th>
                  <Th>Up-to-date</Th>
                  <Th>Available</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredDaemonSets.length > 0 ? (
                  filteredDaemonSets.map((ds) => (
                    <Tr key={`${ds.namespace}-${ds.name}`}>
                      <Td dataLabel="Name">
                        <strong>{ds.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{ds.namespace}</Td>
                      <Td dataLabel="Status">
                        <Label color={getStatusColor(ds)}>
                          {ds.ready === ds.desired ? 'Running' : 'Updating'}
                        </Label>
                      </Td>
                      <Td dataLabel="Desired">{ds.desired}</Td>
                      <Td dataLabel="Current">{ds.current}</Td>
                      <Td dataLabel="Ready">{ds.ready}</Td>
                      <Td dataLabel="Up-to-date">{ds.upToDate}</Td>
                      <Td dataLabel="Available">{ds.available}</Td>
                      <Td dataLabel="Age">{ds.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={9} style={{ textAlign: 'center' }}>
                      {searchValue
                        ? 'No DaemonSets found matching your search'
                        : 'No DaemonSets found'}
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
