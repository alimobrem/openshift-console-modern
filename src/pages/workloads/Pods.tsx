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
  Button,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { Label } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useClusterStore } from '@/store/useClusterStore';

export default function Pods() {
  const navigate = useNavigate();
  const { pods, fetchClusterData } = useClusterStore();
  const [searchValue, setSearchValue] = React.useState('');

  useEffect(() => {
    fetchClusterData();
  }, [fetchClusterData]);

  const filteredPods = pods.filter((pod) =>
    pod.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running':
        return 'green';
      case 'Pending':
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
          Pods
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          View and manage pod instances across all namespaces
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="pods-toolbar">
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
                    Create Pod
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Pods table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Status</Th>
                  <Th>Restarts</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredPods.length > 0 ? (
                  filteredPods.map((pod) => (
                    <Tr
                      key={pod.name}
                      isClickable
                      onRowClick={() => navigate(`/workloads/pods/${pod.namespace}/${pod.name}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Td dataLabel="Name">
                        <strong>{pod.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{pod.namespace}</Td>
                      <Td dataLabel="Status">
                        <Label color={getStatusColor(pod.status)}>{pod.status}</Label>
                      </Td>
                      <Td dataLabel="Restarts">{pod.restarts}</Td>
                      <Td dataLabel="Age">2h</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={5} style={{ textAlign: 'center' }}>
                      {searchValue ? 'No pods found matching your search' : 'No pods found'}
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
