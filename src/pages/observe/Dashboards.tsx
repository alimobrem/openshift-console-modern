import {
  PageSection,
  Title,
  Card,
  CardBody,
  Gallery,
  GalleryItem,
  Label,
  Button,
} from '@patternfly/react-core';
import { useUIStore } from '@/store/useUIStore';
import { useK8sResource, type K8sMeta } from '@/hooks/useK8sResource';
import '@/openshift-components.css';

interface Dashboard {
  name: string;
  namespace: string;
  title: string;
  folder: string;
  age: string;
}

interface RawConfigMap extends K8sMeta {
  data?: Record<string, string>;
}

export default function Dashboards() {
  const addToast = useUIStore((s) => s.addToast);

  // Fetch Grafana dashboard ConfigMaps from openshift-config-managed and openshift-monitoring
  const { data: monitoringCMs, loading: l1 } = useK8sResource<RawConfigMap, Dashboard>(
    '/api/v1/namespaces/openshift-config-managed/configmaps',
    (item) => ({
      name: item.metadata.name,
      namespace: item.metadata.namespace ?? '',
      title: item.metadata.labels?.['console.openshift.io/dashboard'] === 'true'
        ? (item.metadata.annotations?.['console.openshift.io/dashboard-name'] ?? item.metadata.name)
        : item.metadata.name,
      folder: item.metadata.labels?.['console.openshift.io/dashboard-folder'] ?? 'General',
      age: '',
    }),
  );

  const { data: monitoringDashboards, loading: l2 } = useK8sResource<RawConfigMap, Dashboard>(
    '/api/v1/namespaces/openshift-monitoring/configmaps',
    (item) => ({
      name: item.metadata.name,
      namespace: item.metadata.namespace ?? '',
      title: item.metadata.name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      folder: 'Monitoring',
      age: '',
    }),
  );

  // Filter to likely dashboard configmaps (contain "dashboard" or "grafana" in name)
  const dashboards = [...monitoringCMs, ...monitoringDashboards].filter((d) =>
    d.name.includes('dashboard') || d.name.includes('grafana') || d.name.includes('prometheus')
  );

  const loading = l1 || l2;

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">Dashboards</Title>
        <p className="os-dashboards__description">
          Monitoring dashboards from your cluster
        </p>
      </PageSection>

      <PageSection>
        {loading ? (
          <p className="os-text-muted">Loading dashboards...</p>
        ) : dashboards.length === 0 ? (
          <Card>
            <CardBody>
              <p className="os-text-muted">No dashboard ConfigMaps found in monitoring namespaces.</p>
            </CardBody>
          </Card>
        ) : (
          <Gallery hasGutter minWidths={{ default: '100%', sm: '280px', md: '320px' }}>
            {dashboards.map((dash) => (
              <GalleryItem key={`${dash.namespace}-${dash.name}`}>
                <Card isFullHeight className="os-dashboards__card">
                  <CardBody>
                    <div className="os-dashboards__card-header">
                      <div className="os-dashboards__card-title">{dash.title}</div>
                      <p className="os-dashboards__card-desc">
                        {dash.namespace}/{dash.name}
                      </p>
                    </div>
                    <div className="os-dashboards__card-footer">
                      <div className="os-dashboards__label-group">
                        <Label color="blue">{dash.folder}</Label>
                        <Label color="grey">{dash.namespace}</Label>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => addToast({ type: 'info', title: `Opening ${dash.title}` })}
                      >
                        View
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </GalleryItem>
            ))}
          </Gallery>
        )}
      </PageSection>
    </>
  );
}
