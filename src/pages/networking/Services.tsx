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

interface Service {
  name: string;
  namespace: string;
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName';
  clusterIP: string;
  externalIP: string;
  ports: string;
  age: string;
}

const mockServices: Service[] = [
  {
    name: 'frontend',
    namespace: 'default',
    type: 'LoadBalancer',
    clusterIP: '10.96.0.1',
    externalIP: '203.0.113.1',
    ports: '80/TCP, 443/TCP',
    age: '30d',
  },
  {
    name: 'backend-api',
    namespace: 'default',
    type: 'ClusterIP',
    clusterIP: '10.96.1.5',
    externalIP: '<none>',
    ports: '8080/TCP',
    age: '25d',
  },
  {
    name: 'database',
    namespace: 'database',
    type: 'ClusterIP',
    clusterIP: '10.96.2.10',
    externalIP: '<none>',
    ports: '5432/TCP',
    age: '60d',
  },
  {
    name: 'redis',
    namespace: 'cache',
    type: 'ClusterIP',
    clusterIP: '10.96.3.15',
    externalIP: '<none>',
    ports: '6379/TCP',
    age: '45d',
  },
  {
    name: 'monitoring',
    namespace: 'monitoring',
    type: 'NodePort',
    clusterIP: '10.96.4.20',
    externalIP: '<none>',
    ports: '9090:30090/TCP',
    age: '90d',
  },
];

export default function Services() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredServices = mockServices.filter(
    (svc) =>
      svc.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      svc.namespace.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getTypeColor = (type: Service['type']) => {
    switch (type) {
      case 'LoadBalancer':
        return 'purple';
      case 'NodePort':
        return 'blue';
      case 'ClusterIP':
        return 'green';
      case 'ExternalName':
        return 'cyan';
      default:
        return 'grey';
    }
  };

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Services
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage service discovery and load balancing
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="services-toolbar">
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
                    Create Service
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Services table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Type</Th>
                  <Th>Cluster IP</Th>
                  <Th>External IP</Th>
                  <Th>Ports</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredServices.length > 0 ? (
                  filteredServices.map((svc) => (
                    <Tr key={`${svc.namespace}-${svc.name}`}>
                      <Td dataLabel="Name">
                        <strong>{svc.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{svc.namespace}</Td>
                      <Td dataLabel="Type">
                        <Label color={getTypeColor(svc.type)}>{svc.type}</Label>
                      </Td>
                      <Td dataLabel="Cluster IP">
                        <code style={{ fontSize: '0.875rem' }}>{svc.clusterIP}</code>
                      </Td>
                      <Td dataLabel="External IP">
                        {svc.externalIP === '<none>' ? (
                          <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                            {svc.externalIP}
                          </span>
                        ) : (
                          <code style={{ fontSize: '0.875rem' }}>{svc.externalIP}</code>
                        )}
                      </Td>
                      <Td dataLabel="Ports">{svc.ports}</Td>
                      <Td dataLabel="Age">{svc.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={7} style={{ textAlign: 'center' }}>
                      {searchValue ? 'No Services found matching your search' : 'No Services found'}
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
