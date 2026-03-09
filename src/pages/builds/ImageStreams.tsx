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

interface ImageStream {
  name: string;
  namespace: string;
  tags: number;
  updated: string;
  dockerRepo: string;
  age: string;
}

const mockImageStreams: ImageStream[] = [
  {
    name: 'frontend',
    namespace: 'default',
    tags: 5,
    updated: '10m',
    dockerRepo: 'image-registry.openshift.io/default/frontend',
    age: '30d',
  },
  {
    name: 'backend-api',
    namespace: 'default',
    tags: 8,
    updated: '1h',
    dockerRepo: 'image-registry.openshift.io/default/backend-api',
    age: '25d',
  },
  {
    name: 'nodejs',
    namespace: 'openshift',
    tags: 12,
    updated: '7d',
    dockerRepo: 'image-registry.openshift.io/openshift/nodejs',
    age: '120d',
  },
  {
    name: 'nginx',
    namespace: 'openshift',
    tags: 6,
    updated: '14d',
    dockerRepo: 'image-registry.openshift.io/openshift/nginx',
    age: '120d',
  },
  {
    name: 'database-migration',
    namespace: 'database',
    tags: 3,
    updated: '2h',
    dockerRepo: 'image-registry.openshift.io/database/database-migration',
    age: '60d',
  },
];

export default function ImageStreams() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredImageStreams = mockImageStreams.filter(
    (is) =>
      is.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      is.namespace.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Image Streams
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage container image streams and tags
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="imagestreams-toolbar">
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
                    Create ImageStream
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Image Streams table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Tags</Th>
                  <Th>Docker Repository</Th>
                  <Th>Updated</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredImageStreams.length > 0 ? (
                  filteredImageStreams.map((is) => (
                    <Tr key={`${is.namespace}-${is.name}`}>
                      <Td dataLabel="Name">
                        <strong>{is.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{is.namespace}</Td>
                      <Td dataLabel="Tags">
                        <Label color="blue">{is.tags} tags</Label>
                      </Td>
                      <Td dataLabel="Docker Repository">
                        <code style={{ fontSize: '0.75rem' }}>{is.dockerRepo}</code>
                      </Td>
                      <Td dataLabel="Updated">{is.updated}</Td>
                      <Td dataLabel="Age">{is.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={6} style={{ textAlign: 'center' }}>
                      {searchValue
                        ? 'No Image Streams found matching your search'
                        : 'No Image Streams found'}
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
