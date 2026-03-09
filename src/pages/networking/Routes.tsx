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
import { PlusCircleIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';

interface Route {
  name: string;
  namespace: string;
  host: string;
  path: string;
  service: string;
  termination: 'edge' | 'passthrough' | 'reencrypt' | 'none';
  age: string;
}

const mockRoutes: Route[] = [
  {
    name: 'frontend',
    namespace: 'default',
    host: 'frontend.apps.cluster.example.com',
    path: '/',
    service: 'frontend',
    termination: 'edge',
    age: '30d',
  },
  {
    name: 'api',
    namespace: 'default',
    host: 'api.apps.cluster.example.com',
    path: '/api',
    service: 'backend-api',
    termination: 'edge',
    age: '25d',
  },
  {
    name: 'console',
    namespace: 'openshift-console',
    host: 'console-openshift-console.apps.cluster.example.com',
    path: '/',
    service: 'console',
    termination: 'reencrypt',
    age: '120d',
  },
  {
    name: 'grafana',
    namespace: 'monitoring',
    host: 'grafana.apps.cluster.example.com',
    path: '/',
    service: 'grafana',
    termination: 'edge',
    age: '90d',
  },
];

export default function Routes() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredRoutes = mockRoutes.filter(
    (route) =>
      route.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      route.namespace.toLowerCase().includes(searchValue.toLowerCase()) ||
      route.host.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getTerminationColor = (termination: Route['termination']) => {
    switch (termination) {
      case 'edge':
        return 'green';
      case 'passthrough':
        return 'blue';
      case 'reencrypt':
        return 'purple';
      case 'none':
        return 'grey';
      default:
        return 'grey';
    }
  };

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Routes
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage external access to services (OpenShift-specific)
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="routes-toolbar">
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
                    Create Route
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Routes table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Host</Th>
                  <Th>Path</Th>
                  <Th>Service</Th>
                  <Th>TLS Termination</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredRoutes.length > 0 ? (
                  filteredRoutes.map((route) => (
                    <Tr key={`${route.namespace}-${route.name}`}>
                      <Td dataLabel="Name">
                        <strong>{route.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{route.namespace}</Td>
                      <Td dataLabel="Host">
                        <a
                          href={`https://${route.host}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--pf-t--global--color--brand--default)',
                            textDecoration: 'none',
                          }}
                        >
                          <span style={{ fontSize: '0.875rem' }}>{route.host}</span>
                          <ExternalLinkAltIcon />
                        </a>
                      </Td>
                      <Td dataLabel="Path">
                        <code style={{ fontSize: '0.875rem' }}>{route.path}</code>
                      </Td>
                      <Td dataLabel="Service">{route.service}</Td>
                      <Td dataLabel="TLS Termination">
                        <Label color={getTerminationColor(route.termination)}>
                          {route.termination}
                        </Label>
                      </Td>
                      <Td dataLabel="Age">{route.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={7} style={{ textAlign: 'center' }}>
                      {searchValue ? 'No Routes found matching your search' : 'No Routes found'}
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
