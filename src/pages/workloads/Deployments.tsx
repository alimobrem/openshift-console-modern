import React from 'react';
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
  Label,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { PlusCircleIcon } from '@patternfly/react-icons';

export default function Deployments() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');

  const mockDeployments = [
    { name: 'frontend', namespace: 'default', replicas: '3/3', available: 3, updated: true },
    { name: 'backend-api', namespace: 'default', replicas: '2/2', available: 2, updated: true },
    { name: 'database', namespace: 'production', replicas: '1/1', available: 1, updated: true },
    { name: 'cache', namespace: 'production', replicas: '2/2', available: 2, updated: true },
  ];

  const filteredDeployments = mockDeployments.filter((deployment) =>
    deployment.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Deployments
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage deployment resources across your cluster
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="deployments-toolbar">
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
                    Create Deployment
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Deployments table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Status</Th>
                  <Th>Replicas</Th>
                  <Th>Available</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredDeployments.length > 0 ? (
                  filteredDeployments.map((deployment) => (
                    <Tr
                      key={deployment.name}
                      isClickable
                      onRowClick={() => navigate(`/workloads/deployments/${deployment.namespace}/${deployment.name}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Td dataLabel="Name">
                        <strong>{deployment.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{deployment.namespace}</Td>
                      <Td dataLabel="Status">
                        <Label color={deployment.updated ? 'green' : 'orange'}>
                          {deployment.updated ? 'Up to date' : 'Updating'}
                        </Label>
                      </Td>
                      <Td dataLabel="Replicas">{deployment.replicas}</Td>
                      <Td dataLabel="Available">{deployment.available}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={5} style={{ textAlign: 'center' }}>
                      {searchValue ? 'No deployments found matching your search' : 'No deployments found'}
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
