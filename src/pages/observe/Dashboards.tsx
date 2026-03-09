import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Gallery,
  GalleryItem,
  CardTitle,
  Label,
  Button,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';

interface Dashboard {
  name: string;
  description: string;
  category: string;
  panels: number;
  url: string;
}

const mockDashboards: Dashboard[] = [
  {
    name: 'Kubernetes / Compute Resources / Cluster',
    description: 'Cluster-wide compute resource utilization',
    category: 'Kubernetes',
    panels: 12,
    url: '/grafana/d/cluster',
  },
  {
    name: 'Kubernetes / Compute Resources / Namespace (Pods)',
    description: 'Pod compute resources by namespace',
    category: 'Kubernetes',
    panels: 8,
    url: '/grafana/d/namespace-pods',
  },
  {
    name: 'Node Exporter / Nodes',
    description: 'Node-level system metrics',
    category: 'Infrastructure',
    panels: 16,
    url: '/grafana/d/nodes',
  },
  {
    name: 'Etcd',
    description: 'Etcd cluster health and performance',
    category: 'Infrastructure',
    panels: 10,
    url: '/grafana/d/etcd',
  },
  {
    name: 'API Server',
    description: 'Kubernetes API server metrics',
    category: 'Control Plane',
    panels: 14,
    url: '/grafana/d/apiserver',
  },
  {
    name: 'Prometheus',
    description: 'Prometheus metrics and performance',
    category: 'Monitoring',
    panels: 9,
    url: '/grafana/d/prometheus',
  },
];

export default function Dashboards() {
  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Dashboards
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          View Grafana monitoring dashboards
        </p>
      </PageSection>

      <PageSection>
        <Gallery hasGutter minWidths={{ default: '320px' }}>
          {mockDashboards.map((dashboard) => (
            <GalleryItem key={dashboard.name}>
              <Card isFullHeight>
                <CardTitle>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
                    <strong style={{ flex: 1 }}>{dashboard.name}</strong>
                    <Label color="blue" isCompact>{dashboard.category}</Label>
                  </div>
                </CardTitle>
                <CardBody>
                  <p style={{ fontSize: '0.875rem', marginBottom: '12px', color: 'var(--pf-v6-global--Color--100)' }}>
                    {dashboard.description}
                  </p>
                  <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)', marginBottom: '16px' }}>
                    {dashboard.panels} panels
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    isBlock
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="end"
                    component="a"
                    href={dashboard.url}
                    target="_blank"
                  >
                    View Dashboard
                  </Button>
                </CardBody>
              </Card>
            </GalleryItem>
          ))}
        </Gallery>
      </PageSection>
    </>
  );
}
