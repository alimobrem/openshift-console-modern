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
import { PlusCircleIcon, EyeSlashIcon } from '@patternfly/react-icons';

interface Secret {
  name: string;
  namespace: string;
  type: string;
  dataKeys: number;
  age: string;
}

const mockSecrets: Secret[] = [
  {
    name: 'database-credentials',
    namespace: 'default',
    type: 'Opaque',
    dataKeys: 3,
    age: '60d',
  },
  {
    name: 'api-keys',
    namespace: 'default',
    type: 'Opaque',
    dataKeys: 2,
    age: '45d',
  },
  {
    name: 'tls-certificate',
    namespace: 'default',
    type: 'kubernetes.io/tls',
    dataKeys: 2,
    age: '90d',
  },
  {
    name: 'docker-registry',
    namespace: 'default',
    type: 'kubernetes.io/dockerconfigjson',
    dataKeys: 1,
    age: '120d',
  },
  {
    name: 'ssh-key',
    namespace: 'ci-cd',
    type: 'kubernetes.io/ssh-auth',
    dataKeys: 1,
    age: '30d',
  },
  {
    name: 'service-account-token',
    namespace: 'kube-system',
    type: 'kubernetes.io/service-account-token',
    dataKeys: 3,
    age: '120d',
  },
];

export default function Secrets() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredSecrets = mockSecrets.filter(
    (secret) =>
      secret.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      secret.namespace.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    if (type.includes('tls')) return 'purple';
    if (type.includes('dockerconfigjson')) return 'teal';
    if (type.includes('ssh-auth')) return 'orange';
    if (type.includes('service-account-token')) return 'blue';
    return 'grey';
  };

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Secrets
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage sensitive information like passwords, tokens, and keys
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="secrets-toolbar">
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
                    Create Secret
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Secrets table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Type</Th>
                  <Th>Data Keys</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredSecrets.length > 0 ? (
                  filteredSecrets.map((secret) => (
                    <Tr key={`${secret.namespace}-${secret.name}`}>
                      <Td dataLabel="Name">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <EyeSlashIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
                          <strong>{secret.name}</strong>
                        </div>
                      </Td>
                      <Td dataLabel="Namespace">{secret.namespace}</Td>
                      <Td dataLabel="Type">
                        <Label color={getTypeColor(secret.type)}>{secret.type}</Label>
                      </Td>
                      <Td dataLabel="Data Keys">{secret.dataKeys}</Td>
                      <Td dataLabel="Age">{secret.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={5} style={{ textAlign: 'center' }}>
                      {searchValue ? 'No Secrets found matching your search' : 'No Secrets found'}
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
