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

interface StorageClass {
  name: string;
  provisioner: string;
  reclaimPolicy: 'Delete' | 'Retain';
  volumeBindingMode: 'Immediate' | 'WaitForFirstConsumer';
  allowVolumeExpansion: boolean;
  default: boolean;
  age: string;
}

const mockStorageClasses: StorageClass[] = [
  {
    name: 'fast-ssd',
    provisioner: 'kubernetes.io/aws-ebs',
    reclaimPolicy: 'Delete',
    volumeBindingMode: 'WaitForFirstConsumer',
    allowVolumeExpansion: true,
    default: true,
    age: '120d',
  },
  {
    name: 'standard',
    provisioner: 'kubernetes.io/gce-pd',
    reclaimPolicy: 'Delete',
    volumeBindingMode: 'Immediate',
    allowVolumeExpansion: true,
    default: false,
    age: '120d',
  },
  {
    name: 'slow-hdd',
    provisioner: 'kubernetes.io/azure-disk',
    reclaimPolicy: 'Delete',
    volumeBindingMode: 'Immediate',
    allowVolumeExpansion: false,
    default: false,
    age: '120d',
  },
  {
    name: 'nfs',
    provisioner: 'nfs.csi.k8s.io',
    reclaimPolicy: 'Retain',
    volumeBindingMode: 'Immediate',
    allowVolumeExpansion: true,
    default: false,
    age: '90d',
  },
];

export default function StorageClasses() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredStorageClasses = mockStorageClasses.filter((sc) =>
    sc.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Storage Classes
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage dynamic storage provisioning policies
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="storage-classes-toolbar">
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
                    Create Storage Class
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Storage Classes table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Provisioner</Th>
                  <Th>Reclaim Policy</Th>
                  <Th>Volume Binding Mode</Th>
                  <Th>Allow Expansion</Th>
                  <Th>Default</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredStorageClasses.length > 0 ? (
                  filteredStorageClasses.map((sc) => (
                    <Tr key={sc.name}>
                      <Td dataLabel="Name">
                        <strong>{sc.name}</strong>
                        {sc.default && (
                          <Label
                            color="blue"
                            style={{ marginLeft: '8px' }}
                          >
                            default
                          </Label>
                        )}
                      </Td>
                      <Td dataLabel="Provisioner">
                        <code style={{ fontSize: '0.875rem' }}>{sc.provisioner}</code>
                      </Td>
                      <Td dataLabel="Reclaim Policy">{sc.reclaimPolicy}</Td>
                      <Td dataLabel="Volume Binding Mode">{sc.volumeBindingMode}</Td>
                      <Td dataLabel="Allow Expansion">
                        <Label color={sc.allowVolumeExpansion ? 'green' : 'grey'}>
                          {sc.allowVolumeExpansion ? 'Yes' : 'No'}
                        </Label>
                      </Td>
                      <Td dataLabel="Default">
                        {sc.default ? (
                          <Label color="blue">Yes</Label>
                        ) : (
                          <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>No</span>
                        )}
                      </Td>
                      <Td dataLabel="Age">{sc.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={7} style={{ textAlign: 'center' }}>
                      {searchValue
                        ? 'No Storage Classes found matching your search'
                        : 'No Storage Classes found'}
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
