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

interface PersistentVolumeClaim {
  name: string;
  namespace: string;
  status: 'Bound' | 'Pending' | 'Lost';
  volume: string;
  capacity: string;
  accessModes: string[];
  storageClass: string;
  age: string;
}

const mockPVCs: PersistentVolumeClaim[] = [
  {
    name: 'data-pvc',
    namespace: 'default',
    status: 'Bound',
    volume: 'pv-data-001',
    capacity: '100Gi',
    accessModes: ['RWO'],
    storageClass: 'fast-ssd',
    age: '60d',
  },
  {
    name: 'logs-pvc',
    namespace: 'logging',
    status: 'Bound',
    volume: 'pv-logs-001',
    capacity: '50Gi',
    accessModes: ['RWO'],
    storageClass: 'standard',
    age: '45d',
  },
  {
    name: 'shared-pvc',
    namespace: 'default',
    status: 'Bound',
    volume: 'pv-shared-001',
    capacity: '200Gi',
    accessModes: ['RWX'],
    storageClass: 'nfs',
    age: '90d',
  },
  {
    name: 'database-pvc',
    namespace: 'database',
    status: 'Bound',
    volume: 'pv-db-001',
    capacity: '150Gi',
    accessModes: ['RWO'],
    storageClass: 'fast-ssd',
    age: '75d',
  },
  {
    name: 'pending-pvc',
    namespace: 'default',
    status: 'Pending',
    volume: '-',
    capacity: '-',
    accessModes: ['RWO'],
    storageClass: 'slow-hdd',
    age: '5m',
  },
];

export default function PersistentVolumeClaims() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredPVCs = mockPVCs.filter(
    (pvc) =>
      pvc.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      pvc.namespace.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getStatusColor = (status: PersistentVolumeClaim['status']) => {
    switch (status) {
      case 'Bound':
        return 'green';
      case 'Pending':
        return 'orange';
      case 'Lost':
        return 'red';
      default:
        return 'grey';
    }
  };

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Persistent Volume Claims
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage storage requests from applications
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="persistent-volume-claims-toolbar">
              <ToolbarContent>
                <ToolbarItem>
                  <SearchInput
                    placeholder="Search by name or namespace"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="primary" icon={<PlusCircleIcon />}>
                    Create PVC
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Persistent Volume Claims table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Status</Th>
                  <Th>Volume</Th>
                  <Th>Capacity</Th>
                  <Th>Access Modes</Th>
                  <Th>Storage Class</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredPVCs.length > 0 ? (
                  filteredPVCs.map((pvc) => (
                    <Tr key={`${pvc.namespace}-${pvc.name}`}>
                      <Td dataLabel="Name">
                        <strong>{pvc.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{pvc.namespace}</Td>
                      <Td dataLabel="Status">
                        <Label color={getStatusColor(pvc.status)}>{pvc.status}</Label>
                      </Td>
                      <Td dataLabel="Volume">
                        {pvc.volume === '-' ? (
                          <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>-</span>
                        ) : (
                          pvc.volume
                        )}
                      </Td>
                      <Td dataLabel="Capacity">{pvc.capacity}</Td>
                      <Td dataLabel="Access Modes">
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {pvc.accessModes.map((mode) => (
                            <Label key={mode} color="teal">
                              {mode}
                            </Label>
                          ))}
                        </div>
                      </Td>
                      <Td dataLabel="Storage Class">{pvc.storageClass}</Td>
                      <Td dataLabel="Age">{pvc.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={8} style={{ textAlign: 'center' }}>
                      {searchValue
                        ? 'No Persistent Volume Claims found matching your search'
                        : 'No Persistent Volume Claims found'}
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
