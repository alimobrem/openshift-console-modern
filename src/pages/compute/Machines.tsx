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

interface Machine {
  name: string;
  namespace: string;
  phase: 'Running' | 'Provisioning' | 'Provisioned' | 'Failed' | 'Deleting';
  type: string;
  region: string;
  zone: string;
  age: string;
}

const mockMachines: Machine[] = [
  {
    name: 'master-0',
    namespace: 'openshift-machine-api',
    phase: 'Running',
    type: 'm5.xlarge',
    region: 'us-east-1',
    zone: 'us-east-1a',
    age: '120d',
  },
  {
    name: 'master-1',
    namespace: 'openshift-machine-api',
    phase: 'Running',
    type: 'm5.xlarge',
    region: 'us-east-1',
    zone: 'us-east-1b',
    age: '120d',
  },
  {
    name: 'master-2',
    namespace: 'openshift-machine-api',
    phase: 'Running',
    type: 'm5.xlarge',
    region: 'us-east-1',
    zone: 'us-east-1c',
    age: '120d',
  },
  {
    name: 'worker-0',
    namespace: 'openshift-machine-api',
    phase: 'Running',
    type: 'm5.2xlarge',
    region: 'us-east-1',
    zone: 'us-east-1a',
    age: '120d',
  },
  {
    name: 'worker-1',
    namespace: 'openshift-machine-api',
    phase: 'Running',
    type: 'm5.2xlarge',
    region: 'us-east-1',
    zone: 'us-east-1b',
    age: '120d',
  },
];

export default function Machines() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredMachines = mockMachines.filter(
    (machine) =>
      machine.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      machine.type.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getPhaseColor = (phase: Machine['phase']) => {
    switch (phase) {
      case 'Running':
        return 'green';
      case 'Provisioning':
        return 'blue';
      case 'Provisioned':
        return 'cyan';
      case 'Failed':
        return 'red';
      case 'Deleting':
        return 'orange';
      default:
        return 'grey';
    }
  };

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Machines
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage machine resources for cluster infrastructure
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="machines-toolbar">
              <ToolbarContent>
                <ToolbarItem variant="search-filter">
                  <SearchInput
                    placeholder="Search by name or type"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="primary" icon={<PlusCircleIcon />}>
                    Create Machine
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Machines table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Phase</Th>
                  <Th>Type</Th>
                  <Th>Region</Th>
                  <Th>Zone</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredMachines.length > 0 ? (
                  filteredMachines.map((machine) => (
                    <Tr key={`${machine.namespace}-${machine.name}`}>
                      <Td dataLabel="Name">
                        <strong>{machine.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{machine.namespace}</Td>
                      <Td dataLabel="Phase">
                        <Label color={getPhaseColor(machine.phase)}>{machine.phase}</Label>
                      </Td>
                      <Td dataLabel="Type">
                        <code style={{ fontSize: '0.875rem' }}>{machine.type}</code>
                      </Td>
                      <Td dataLabel="Region">{machine.region}</Td>
                      <Td dataLabel="Zone">{machine.zone}</Td>
                      <Td dataLabel="Age">{machine.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={7} style={{ textAlign: 'center' }}>
                      {searchValue ? 'No Machines found matching your search' : 'No Machines found'}
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
