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

interface Namespace {
  name: string;
  status: 'Active' | 'Terminating';
  labels: { [key: string]: string };
  age: string;
}

const mockNamespaces: Namespace[] = [
  {
    name: 'default',
    status: 'Active',
    labels: {},
    age: '120d',
  },
  {
    name: 'kube-system',
    status: 'Active',
    labels: { 'kubernetes.io/metadata.name': 'kube-system' },
    age: '120d',
  },
  {
    name: 'kube-public',
    status: 'Active',
    labels: {},
    age: '120d',
  },
  {
    name: 'openshift-console',
    status: 'Active',
    labels: { 'openshift.io/cluster-monitoring': 'true' },
    age: '120d',
  },
  {
    name: 'monitoring',
    status: 'Active',
    labels: { 'openshift.io/cluster-monitoring': 'true' },
    age: '90d',
  },
  {
    name: 'logging',
    status: 'Active',
    labels: {},
    age: '75d',
  },
  {
    name: 'database',
    status: 'Active',
    labels: { env: 'production' },
    age: '60d',
  },
  {
    name: 'cache',
    status: 'Active',
    labels: { env: 'production' },
    age: '45d',
  },
  {
    name: 'analytics',
    status: 'Active',
    labels: { env: 'production' },
    age: '30d',
  },
  {
    name: 'messaging',
    status: 'Active',
    labels: { env: 'production' },
    age: '45d',
  },
];

export default function Namespaces() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredNamespaces = mockNamespaces.filter((ns) =>
    ns.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Namespaces
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage namespaces and project isolation
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="namespaces-toolbar">
              <ToolbarContent>
                <ToolbarItem>
                  <SearchInput
                    placeholder="Search by name"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="primary" icon={<PlusCircleIcon />}>
                    Create Namespace
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Namespaces table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>Labels</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredNamespaces.length > 0 ? (
                  filteredNamespaces.map((ns) => (
                    <Tr key={ns.name}>
                      <Td dataLabel="Name">
                        <strong>{ns.name}</strong>
                      </Td>
                      <Td dataLabel="Status">
                        <Label color={ns.status === 'Active' ? 'green' : 'orange'}>
                          {ns.status}
                        </Label>
                      </Td>
                      <Td dataLabel="Labels">
                        {Object.keys(ns.labels).length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {Object.entries(ns.labels).map(([key, value]) => (
                              <Label key={key} color="grey">
                                <code style={{ fontSize: '0.75rem' }}>
                                  {key}={value}
                                </code>
                              </Label>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                            No labels
                          </span>
                        )}
                      </Td>
                      <Td dataLabel="Age">{ns.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={4} style={{ textAlign: 'center' }}>
                      {searchValue
                        ? 'No Namespaces found matching your search'
                        : 'No Namespaces found'}
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
