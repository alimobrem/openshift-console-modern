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
  Label,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';

interface InstalledOperator {
  name: string;
  namespace: string;
  displayName: string;
  version: string;
  status: 'Succeeded' | 'Installing' | 'Failed';
  provider: string;
  age: string;
}

const mockInstalledOperators: InstalledOperator[] = [
  {
    name: 'prometheus',
    namespace: 'monitoring',
    displayName: 'Prometheus Operator',
    version: '0.68.0',
    status: 'Succeeded',
    provider: 'Red Hat',
    age: '90d',
  },
  {
    name: 'cluster-logging',
    namespace: 'openshift-logging',
    displayName: 'Cluster Logging Operator',
    version: '5.8.0',
    status: 'Succeeded',
    provider: 'Red Hat',
    age: '75d',
  },
  {
    name: 'service-mesh',
    namespace: 'openshift-operators',
    displayName: 'Red Hat OpenShift Service Mesh',
    version: '2.5.0',
    status: 'Succeeded',
    provider: 'Red Hat',
    age: '60d',
  },
];

export default function InstalledOperators() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredOperators = mockInstalledOperators.filter(
    (op) =>
      op.displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
      op.namespace.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getStatusColor = (status: InstalledOperator['status']) => {
    switch (status) {
      case 'Succeeded':
        return 'green';
      case 'Installing':
        return 'blue';
      case 'Failed':
        return 'red';
      default:
        return 'grey';
    }
  };

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Installed Operators
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage installed operators in your cluster
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="installed-operators-toolbar">
              <ToolbarContent>
                <ToolbarItem>
                  <SearchInput
                    placeholder="Search by name or namespace"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Installed Operators table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Version</Th>
                  <Th>Status</Th>
                  <Th>Provider</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredOperators.length > 0 ? (
                  filteredOperators.map((op) => (
                    <Tr key={`${op.namespace}-${op.name}`}>
                      <Td dataLabel="Name">
                        <strong>{op.displayName}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{op.namespace}</Td>
                      <Td dataLabel="Version">{op.version}</Td>
                      <Td dataLabel="Status">
                        <Label color={getStatusColor(op.status)}>{op.status}</Label>
                      </Td>
                      <Td dataLabel="Provider">{op.provider}</Td>
                      <Td dataLabel="Age">{op.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={6} style={{ textAlign: 'center' }}>
                      {searchValue
                        ? 'No installed operators found matching your search'
                        : 'No installed operators found'}
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
