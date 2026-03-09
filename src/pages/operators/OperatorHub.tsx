import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Gallery,
  GalleryItem,
  Label,
  Button,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { useUIStore } from '@/store/useUIStore';
import '@/openshift-components.css';

interface Operator {
  name: string;
  displayName: string;
  provider: string;
  description: string;
  version: string;
  category: string;
  installed: boolean;
  icon: string;
}

const operators: Operator[] = [
  { name: 'prometheus', displayName: 'Prometheus Operator', provider: 'Red Hat', description: 'Manages Prometheus clusters atop Kubernetes.', version: 'v0.65.1', category: 'Monitoring', installed: true, icon: 'P' },
  { name: 'elasticsearch', displayName: 'Elasticsearch Operator', provider: 'Red Hat', description: 'Manages Elasticsearch clusters for logging.', version: 'v5.8.1', category: 'Logging', installed: false, icon: 'E' },
  { name: 'cert-manager', displayName: 'cert-manager', provider: 'Community', description: 'Automates TLS certificate management.', version: 'v1.13.0', category: 'Security', installed: false, icon: 'C' },
  { name: 'argocd', displayName: 'Argo CD', provider: 'Community', description: 'Declarative GitOps continuous delivery tool.', version: 'v2.9.0', category: 'CI/CD', installed: false, icon: 'A' },
  { name: 'vault', displayName: 'Vault Operator', provider: 'HashiCorp', description: 'Manages HashiCorp Vault on Kubernetes.', version: 'v0.25.0', category: 'Security', installed: true, icon: 'V' },
  { name: 'kafka', displayName: 'Strimzi Kafka', provider: 'Community', description: 'Run Apache Kafka on Kubernetes.', version: 'v0.38.0', category: 'Streaming', installed: false, icon: 'K' },
];

const categoryColors: Record<string, 'blue' | 'purple' | 'teal' | 'orange' | 'green'> = {
  Monitoring: 'blue',
  Logging: 'purple',
  Security: 'teal',
  'CI/CD': 'orange',
  Streaming: 'green',
};

export default function OperatorHub() {
  const [searchValue, setSearchValue] = React.useState('');
  const addToast = useUIStore((s) => s.addToast);

  const filtered = operators.filter((op) =>
    op.displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
    op.category.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">OperatorHub</Title>
        <p className="os-operatorhub__description">
          Discover and install operators to extend your cluster capabilities
        </p>
      </PageSection>

      <PageSection>
        <Toolbar id="operatorhub-toolbar" className="os-operatorhub__toolbar">
          <ToolbarContent>
            <ToolbarItem className="os-operatorhub__toolbar-search">
              <SearchInput
                placeholder="Search operators by name or category..."
                value={searchValue}
                onChange={(_e, v) => setSearchValue(v)}
                onClear={() => setSearchValue('')}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        <Gallery hasGutter minWidths={{ default: '100%', sm: '280px', md: '300px' }}>
          {filtered.map((op) => (
            <GalleryItem key={op.name}>
              <Card isFullHeight className="os-operatorhub__card">
                <CardBody>
                  <div className="os-operatorhub__card-header">
                    <div className="os-operatorhub__icon">
                      {op.icon}
                    </div>
                    <div className="os-operatorhub__info">
                      <div className="os-operatorhub__name">{op.displayName}</div>
                      <div className="os-operatorhub__provider">by {op.provider}</div>
                    </div>
                  </div>
                  <p className="os-operatorhub__card-desc">
                    {op.description}
                  </p>
                  <div className="os-operatorhub__card-footer">
                    <div className="os-operatorhub__label-group">
                      <Label color={categoryColors[op.category] ?? 'grey'}>{op.category}</Label>
                      <Label color="grey">{op.version}</Label>
                    </div>
                    {op.installed ? (
                      <Label color="green">Installed</Label>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => addToast({ type: 'success', title: `Installing ${op.displayName}`, description: 'Operator will be available shortly' })}
                      >
                        Install
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            </GalleryItem>
          ))}
        </Gallery>
      </PageSection>
    </>
  );
}
