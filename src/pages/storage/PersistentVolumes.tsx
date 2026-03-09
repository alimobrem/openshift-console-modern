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

interface PersistentVolume {
  name: string;
  capacity: string;
  accessModes: string[];
  reclaimPolicy: 'Retain' | 'Delete' | 'Recycle';
  status: 'Available' | 'Bound' | 'Released' | 'Failed';
  claim: string;
  storageClass: string;
  age: string;
}

const mockPVs: PersistentVolume[] = [
  {
    name: 'pv-data-001',
    capacity: '100Gi',
    accessModes: ['RWO'],
    reclaimPolicy: 'Retain',
    status: 'Bound',
    claim: 'default/data-pvc',
    storageClass: 'fast-ssd',
    age: '60d',
  },
  {
    name: 'pv-logs-001',
    capacity: '50Gi',
    accessModes: ['RWO'],
    reclaimPolicy: 'Delete',
    status: 'Bound',
    claim: 'logging/logs-pvc',
    storageClass: 'standard',
    age: '45d',
  },
  {
    name: 'pv-shared-001',
    capacity: '200Gi',
    accessModes: ['RWX'],
    reclaimPolicy: 'Retain',
    status: 'Bound',
    claim: 'default/shared-pvc',
    storageClass: 'nfs',
    age: '90d',
  },
  {
    name: 'pv-backup-001',
    capacity: '500Gi',
    accessModes: ['RWO'],
    reclaimPolicy: 'Retain',
    status: 'Available',
    claim: '-',
    storageClass: 'slow-hdd',
    age: '120d',
  },
];

export default function PersistentVolumes() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredPVs = mockPVs.filter(
    (pv) =>
      pv.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      pv.claim.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getStatusColor = (status: PersistentVolume['status']) => {
    switch (status) {
      case 'Bound':
        return 'green';
      case 'Available':
        return 'blue';
      case 'Released':
        return 'orange';
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
          Persistent Volumes
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage cluster-wide storage resources
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="persistent-volumes-toolbar">
              <ToolbarContent>
                <ToolbarItem>
                  <SearchInput
                    placeholder="Search by name or claim"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="primary" icon={<PlusCircleIcon />}>
                    Create PV
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Persistent Volumes table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Capacity</Th>
                  <Th>Access Modes</Th>
                  <Th>Reclaim Policy</Th>
                  <Th>Status</Th>
                  <Th>Claim</Th>
                  <Th>Storage Class</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredPVs.length > 0 ? (
                  filteredPVs.map((pv) => (
                    <Tr key={pv.name}>
                      <Td dataLabel="Name">
                        <strong>{pv.name}</strong>
                      </Td>
                      <Td dataLabel="Capacity">{pv.capacity}</Td>
                      <Td dataLabel="Access Modes">
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {pv.accessModes.map((mode) => (
                            <Label key={mode} color="teal">
                              {mode}
                            </Label>
                          ))}
                        </div>
                      </Td>
                      <Td dataLabel="Reclaim Policy">{pv.reclaimPolicy}</Td>
                      <Td dataLabel="Status">
                        <Label color={getStatusColor(pv.status)}>{pv.status}</Label>
                      </Td>
                      <Td dataLabel="Claim">
                        {pv.claim === '-' ? (
                          <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>-</span>
                        ) : (
                          <code style={{ fontSize: '0.875rem' }}>{pv.claim}</code>
                        )}
                      </Td>
                      <Td dataLabel="Storage Class">{pv.storageClass}</Td>
                      <Td dataLabel="Age">{pv.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={8} style={{ textAlign: 'center' }}>
                      {searchValue
                        ? 'No Persistent Volumes found matching your search'
                        : 'No Persistent Volumes found'}
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
