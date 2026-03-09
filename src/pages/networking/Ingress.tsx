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

interface IngressResource {
  name: string;
  namespace: string;
  hosts: string[];
  address: string;
  ports: string;
  age: string;
}

const mockIngress: IngressResource[] = [
  {
    name: 'webapp-ingress',
    namespace: 'default',
    hosts: ['webapp.example.com', 'www.webapp.example.com'],
    address: '203.0.113.10',
    ports: '80, 443',
    age: '45d',
  },
  {
    name: 'api-ingress',
    namespace: 'default',
    hosts: ['api.example.com'],
    address: '203.0.113.11',
    ports: '80, 443',
    age: '40d',
  },
  {
    name: 'monitoring-ingress',
    namespace: 'monitoring',
    hosts: ['grafana.example.com', 'prometheus.example.com'],
    address: '203.0.113.12',
    ports: '80, 443',
    age: '90d',
  },
];

export default function Ingress() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredIngress = mockIngress.filter(
    (ing) =>
      ing.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      ing.namespace.toLowerCase().includes(searchValue.toLowerCase()) ||
      ing.hosts.some((host) => host.toLowerCase().includes(searchValue.toLowerCase()))
  );

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Ingress
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage Kubernetes ingress resources for HTTP(S) routing
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="ingress-toolbar">
              <ToolbarContent>
                <ToolbarItem>
                  <SearchInput
                    placeholder="Search by name, namespace, or host"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="primary" icon={<PlusCircleIcon />}>
                    Create Ingress
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Ingress table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Hosts</Th>
                  <Th>Address</Th>
                  <Th>Ports</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredIngress.length > 0 ? (
                  filteredIngress.map((ing) => (
                    <Tr key={`${ing.namespace}-${ing.name}`}>
                      <Td dataLabel="Name">
                        <strong>{ing.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{ing.namespace}</Td>
                      <Td dataLabel="Hosts">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {ing.hosts.map((host) => (
                            <Label key={host} color="blue">
                              {host}
                            </Label>
                          ))}
                        </div>
                      </Td>
                      <Td dataLabel="Address">
                        <code style={{ fontSize: '0.875rem' }}>{ing.address}</code>
                      </Td>
                      <Td dataLabel="Ports">{ing.ports}</Td>
                      <Td dataLabel="Age">{ing.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={6} style={{ textAlign: 'center' }}>
                      {searchValue ? 'No Ingress found matching your search' : 'No Ingress found'}
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
