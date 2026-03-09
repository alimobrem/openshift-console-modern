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

interface BuildConfig {
  name: string;
  namespace: string;
  type: 'Source' | 'Docker' | 'Custom' | 'JenkinsPipeline';
  gitRepository: string;
  lastBuild: string;
  status: 'Success' | 'Failed' | 'Running' | '-';
  age: string;
}

const mockBuildConfigs: BuildConfig[] = [
  {
    name: 'frontend',
    namespace: 'default',
    type: 'Source',
    gitRepository: 'https://github.com/example/frontend.git',
    lastBuild: 'frontend-1',
    status: 'Success',
    age: '30d',
  },
  {
    name: 'backend-api',
    namespace: 'default',
    type: 'Docker',
    gitRepository: 'https://github.com/example/backend.git',
    lastBuild: 'backend-api-3',
    status: 'Running',
    age: '25d',
  },
  {
    name: 'database-migration',
    namespace: 'database',
    type: 'Source',
    gitRepository: 'https://github.com/example/db-migration.git',
    lastBuild: 'database-migration-2',
    status: 'Success',
    age: '60d',
  },
  {
    name: 'ci-pipeline',
    namespace: 'ci-cd',
    type: 'JenkinsPipeline',
    gitRepository: 'https://github.com/example/ci-pipeline.git',
    lastBuild: '-',
    status: '-',
    age: '15d',
  },
];

export default function BuildConfigs() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredBuildConfigs = mockBuildConfigs.filter(
    (bc) =>
      bc.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      bc.namespace.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getStatusColor = (status: BuildConfig['status']) => {
    switch (status) {
      case 'Success':
        return 'green';
      case 'Running':
        return 'blue';
      case 'Failed':
        return 'red';
      default:
        return 'grey';
    }
  };

  const getTypeColor = (type: BuildConfig['type']) => {
    switch (type) {
      case 'Source':
        return 'blue';
      case 'Docker':
        return 'cyan';
      case 'Custom':
        return 'purple';
      case 'JenkinsPipeline':
        return 'orange';
      default:
        return 'grey';
    }
  };

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Build Configs
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage build configuration templates
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="buildconfigs-toolbar">
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
                    Create BuildConfig
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="BuildConfigs table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Type</Th>
                  <Th>Git Repository</Th>
                  <Th>Last Build</Th>
                  <Th>Status</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredBuildConfigs.length > 0 ? (
                  filteredBuildConfigs.map((bc) => (
                    <Tr key={`${bc.namespace}-${bc.name}`}>
                      <Td dataLabel="Name">
                        <strong>{bc.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{bc.namespace}</Td>
                      <Td dataLabel="Type">
                        <Label color={getTypeColor(bc.type)}>{bc.type}</Label>
                      </Td>
                      <Td dataLabel="Git Repository">
                        <code style={{ fontSize: '0.75rem' }}>
                          {bc.gitRepository.replace('https://github.com/', '')}
                        </code>
                      </Td>
                      <Td dataLabel="Last Build">
                        {bc.lastBuild === '-' ? (
                          <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>-</span>
                        ) : (
                          bc.lastBuild
                        )}
                      </Td>
                      <Td dataLabel="Status">
                        {bc.status === '-' ? (
                          <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>-</span>
                        ) : (
                          <Label color={getStatusColor(bc.status)}>{bc.status}</Label>
                        )}
                      </Td>
                      <Td dataLabel="Age">{bc.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={7} style={{ textAlign: 'center' }}>
                      {searchValue
                        ? 'No BuildConfigs found matching your search'
                        : 'No BuildConfigs found'}
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
