import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  Label,
  Progress,
  ProgressVariant,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { useClusterStore } from '@/store/useClusterStore';

export default function Nodes() {
  const navigate = useNavigate();
  const { nodes, fetchClusterData } = useClusterStore();
  const [searchValue, setSearchValue] = React.useState('');

  useEffect(() => {
    fetchClusterData();
  }, [fetchClusterData]);

  const filteredNodes = nodes.filter((node) =>
    node.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Nodes
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          View and manage cluster nodes
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="nodes-toolbar">
              <ToolbarContent>
                <ToolbarItem variant="search-filter">
                  <SearchInput
                    placeholder="Search by name"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Nodes table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>CPU Usage</Th>
                  <Th>Memory Usage</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredNodes.length > 0 ? (
                  filteredNodes.map((node) => (
                    <Tr
                      key={node.name}
                      isClickable
                      onRowClick={() => navigate(`/compute/nodes/${node.name}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Td dataLabel="Name">
                        <strong>{node.name}</strong>
                      </Td>
                      <Td dataLabel="Status">
                        <Label color={node.status === 'Ready' ? 'green' : 'red'}>
                          {node.status}
                        </Label>
                      </Td>
                      <Td dataLabel="CPU Usage">
                        <Progress
                          value={node.cpu}
                          title={`${node.cpu}%`}
                          variant={
                            node.cpu > 80
                              ? ProgressVariant.danger
                              : node.cpu > 60
                              ? ProgressVariant.warning
                              : ProgressVariant.success
                          }
                        />
                      </Td>
                      <Td dataLabel="Memory Usage">
                        <Progress
                          value={node.memory}
                          title={`${node.memory}%`}
                          variant={
                            node.memory > 80
                              ? ProgressVariant.danger
                              : node.memory > 60
                              ? ProgressVariant.warning
                              : ProgressVariant.success
                          }
                        />
                      </Td>
                      <Td dataLabel="Age">30d</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={5} style={{ textAlign: 'center' }}>
                      {searchValue ? 'No nodes found matching your search' : 'No nodes found'}
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
