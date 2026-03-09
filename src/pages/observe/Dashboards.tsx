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
import '@/openshift-components.css';

interface Dashboard {
  name: string;
  description: string;
  category: string;
  panels: number;
}

const dashboards: Dashboard[] = [
  { name: 'Kubernetes / Compute Resources', description: 'CPU, memory, and network for pods and nodes', category: 'Kubernetes', panels: 12 },
  { name: 'Node Exporter / Full', description: 'Hardware and OS metrics exposed by Node Exporter', category: 'Infrastructure', panels: 24 },
  { name: 'Etcd', description: 'Etcd cluster performance and health', category: 'Kubernetes', panels: 8 },
  { name: 'API Server', description: 'Kubernetes API server request latency and throughput', category: 'Kubernetes', panels: 10 },
  { name: 'Prometheus', description: 'Prometheus server metrics and targets', category: 'Monitoring', panels: 6 },
  { name: 'Cluster Overview', description: 'High-level cluster health and resource usage', category: 'Kubernetes', panels: 16 },
];

export default function Dashboards() {
  const addToast = useUIStore((s) => s.addToast);

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">Dashboards</Title>
        <p className="os-dashboards__description">
          Pre-built monitoring dashboards for cluster observability
        </p>
      </PageSection>

      <PageSection>
        <Gallery hasGutter minWidths={{ default: '100%', sm: '280px', md: '320px' }}>
          {dashboards.map((dash) => (
            <GalleryItem key={dash.name}>
              <Card isFullHeight className="os-dashboards__card">
                <CardBody>
                  <div className="os-dashboards__card-header">
                    <div className="os-dashboards__card-title">{dash.name}</div>
                    <p className="os-dashboards__card-desc">
                      {dash.description}
                    </p>
                  </div>
                  {/* Mini chart preview */}
                  <div className="os-dashboards__chart-preview">
                    <svg width="100%" height="48" viewBox="0 0 300 48" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`dash-${dash.panels}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(251, 146, 60, 0.3)" />
                          <stop offset="100%" stopColor="rgba(251, 146, 60, 0)" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M0,40 Q30,${20 + Math.random() * 20} 75,${15 + Math.random() * 25} T150,${10 + Math.random() * 30} T225,${20 + Math.random() * 20} T300,${15 + Math.random() * 25} V48 H0 Z`}
                        fill={`url(#dash-${dash.panels})`}
                      />
                      <path
                        d={`M0,40 Q30,${20 + Math.random() * 20} 75,${15 + Math.random() * 25} T150,${10 + Math.random() * 30} T225,${20 + Math.random() * 20} T300,${15 + Math.random() * 25}`}
                        fill="none"
                        stroke="rgba(251, 146, 60, 0.6)"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div className="os-dashboards__card-footer">
                    <div className="os-dashboards__label-group">
                      <Label color="blue">{dash.category}</Label>
                      <Label color="grey">{dash.panels} panels</Label>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => addToast({ type: 'info', title: `Opening ${dash.name}` })}
                    >
                      View
                    </Button>
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
