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

interface Build {
  name: string;
  namespace: string;
  status: 'Complete' | 'Running' | 'Failed' | 'Cancelled';
  buildConfig: string;
  duration: string;
  started: string;
}

const mockBuilds: Build[] = [
  {
    name: 'frontend-1',
    namespace: 'default',
    status: 'Complete',
    buildConfig: 'frontend',
    duration: '2m15s',
    started: '10m',
  },
  {
    name: 'backend-api-3',
    namespace: 'default',
    status: 'Running',
    buildConfig: 'backend-api',
    duration: '45s',
    started: '45s',
  },
  {
    name: 'database-migration-2',
    namespace: 'database',
    status: 'Complete',
    buildConfig: 'database-migration',
    duration: '1m30s',
    started: '1h',
  },
  {
    name: 'frontend-0',
    namespace: 'default',
    status: 'Failed',
    buildConfig: 'frontend',
    duration: '30s',
    started: '2h',
  },
];

export default function Builds() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredBuilds = mockBuilds.filter(
    (build) =>
      build.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      build.namespace.toLowerCase().includes(searchValue.toLowerCase()) ||
      build.buildConfig.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getStatusColor = (status: Build['status']) => {
    switch (status) {
      case 'Complete':
        return 'green';
      case 'Running':
        return 'blue';
      case 'Failed':
        return 'red';
      case 'Cancelled':
        return 'orange';
      default:
        return 'grey';
    }
  };

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Builds
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          View and manage build instances
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="builds-toolbar">
              <ToolbarContent>
                <ToolbarItem variant="search-filter">
                  <SearchInput
                    placeholder="Search by name, namespace, or build config"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="primary" icon={<PlusCircleIcon />}>
                    Start Build
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Builds table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Build Config</Th>
                  <Th>Status</Th>
                  <Th>Duration</Th>
                  <Th>Started</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredBuilds.length > 0 ? (
                  filteredBuilds.map((build) => (
                    <Tr key={`${build.namespace}-${build.name}`}>
                      <Td dataLabel="Name">
                        <strong>{build.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{build.namespace}</Td>
                      <Td dataLabel="Build Config">{build.buildConfig}</Td>
                      <Td dataLabel="Status">
                        <Label color={getStatusColor(build.status)}>{build.status}</Label>
                      </Td>
                      <Td dataLabel="Duration">{build.duration}</Td>
                      <Td dataLabel="Started">{build.started}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={6} style={{ textAlign: 'center' }}>
                      {searchValue ? 'No Builds found matching your search' : 'No Builds found'}
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
