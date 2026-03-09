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
  Gallery,
  GalleryItem,
  CardTitle,
  Label,
  Button,
} from '@patternfly/react-core';

interface Operator {
  name: string;
  displayName: string;
  provider: string;
  description: string;
  version: string;
  category: string;
  installed: boolean;
}

const mockOperators: Operator[] = [
  {
    name: 'prometheus',
    displayName: 'Prometheus Operator',
    provider: 'Red Hat',
    description: 'Manages Prometheus instances for monitoring',
    version: '0.68.0',
    category: 'Monitoring',
    installed: true,
  },
  {
    name: 'elasticsearch',
    displayName: 'Elasticsearch Operator',
    provider: 'Elastic',
    description: 'Manages Elasticsearch clusters',
    version: '2.10.0',
    category: 'Logging',
    installed: false,
  },
  {
    name: 'cert-manager',
    displayName: 'Cert Manager Operator',
    provider: 'Jetstack',
    description: 'Automates certificate management',
    version: '1.14.0',
    category: 'Security',
    installed: false,
  },
  {
    name: 'argocd',
    displayName: 'Argo CD Operator',
    provider: 'Argo Project',
    description: 'GitOps continuous delivery tool',
    version: '2.10.0',
    category: 'CI/CD',
    installed: false,
  },
  {
    name: 'vault',
    displayName: 'Vault Operator',
    provider: 'HashiCorp',
    description: 'Manages HashiCorp Vault instances',
    version: '1.16.0',
    category: 'Security',
    installed: false,
  },
  {
    name: 'kafka',
    displayName: 'Kafka Operator',
    provider: 'Strimzi',
    description: 'Manages Apache Kafka clusters',
    version: '0.39.0',
    category: 'Messaging',
    installed: false,
  },
];

export default function OperatorHub() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredOperators = mockOperators.filter(
    (op) =>
      op.displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
      op.description.toLowerCase().includes(searchValue.toLowerCase()) ||
      op.category.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          OperatorHub
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Discover and install operators from the catalog
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="operatorhub-toolbar">
              <ToolbarContent>
                <ToolbarItem>
                  <SearchInput
                    placeholder="Search operators..."
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Gallery hasGutter minWidths={{ default: '280px' }} style={{ marginTop: '16px' }}>
              {filteredOperators.map((operator) => (
                <GalleryItem key={operator.name}>
                  <Card isFullHeight>
                    <CardTitle>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <strong>{operator.displayName}</strong>
                        {operator.installed && (
                          <Label color="green" isCompact>
                            Installed
                          </Label>
                        )}
                      </div>
                    </CardTitle>
                    <CardBody>
                      <div style={{ marginBottom: '12px' }}>
                        <Label color="blue" isCompact>{operator.category}</Label>
                        <span style={{ marginLeft: '8px', fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                          {operator.provider}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', marginBottom: '12px', color: 'var(--pf-v6-global--Color--100)' }}>
                        {operator.description}
                      </p>
                      <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)', marginBottom: '12px' }}>
                        Version: {operator.version}
                      </div>
                      <Button variant={operator.installed ? 'secondary' : 'primary'} size="sm" isBlock>
                        {operator.installed ? 'View Details' : 'Install'}
                      </Button>
                    </CardBody>
                  </Card>
                </GalleryItem>
              ))}
            </Gallery>

            {filteredOperators.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--pf-v6-global--Color--200)' }}>
                No operators found matching your search
              </div>
            )}
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
}
