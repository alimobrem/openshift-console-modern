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

interface NetworkPolicy {
  name: string;
  namespace: string;
  podSelector: string;
  policyTypes: string[];
  age: string;
}

const mockNetworkPolicies: NetworkPolicy[] = [
  {
    name: 'deny-all',
    namespace: 'default',
    podSelector: 'All pods',
    policyTypes: ['Ingress', 'Egress'],
    age: '120d',
  },
  {
    name: 'allow-frontend',
    namespace: 'default',
    podSelector: 'app=frontend',
    policyTypes: ['Ingress'],
    age: '90d',
  },
  {
    name: 'allow-backend-to-db',
    namespace: 'database',
    podSelector: 'app=postgres',
    policyTypes: ['Ingress'],
    age: '60d',
  },
  {
    name: 'allow-monitoring',
    namespace: 'monitoring',
    podSelector: 'app=prometheus',
    policyTypes: ['Ingress', 'Egress'],
    age: '75d',
  },
];

export default function NetworkPolicies() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredPolicies = mockNetworkPolicies.filter(
    (policy) =>
      policy.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      policy.namespace.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Network Policies
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage network segmentation and isolation rules
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="network-policies-toolbar">
              <ToolbarContent>
                <ToolbarItem>
                  <SearchInput
                    placeholder="Search by name or namespace"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="primary" icon={<PlusCircleIcon />}>
                    Create Network Policy
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Network Policies table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Pod Selector</Th>
                  <Th>Policy Types</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredPolicies.length > 0 ? (
                  filteredPolicies.map((policy) => (
                    <Tr key={`${policy.namespace}-${policy.name}`}>
                      <Td dataLabel="Name">
                        <strong>{policy.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{policy.namespace}</Td>
                      <Td dataLabel="Pod Selector">
                        <code style={{ fontSize: '0.875rem' }}>{policy.podSelector}</code>
                      </Td>
                      <Td dataLabel="Policy Types">
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {policy.policyTypes.map((type) => (
                            <Label key={type} color={type === 'Ingress' ? 'blue' : 'purple'}>
                              {type}
                            </Label>
                          ))}
                        </div>
                      </Td>
                      <Td dataLabel="Age">{policy.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={5} style={{ textAlign: 'center' }}>
                      {searchValue
                        ? 'No Network Policies found matching your search'
                        : 'No Network Policies found'}
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
