import React, { useEffect } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Button,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { PlayIcon } from '@patternfly/react-icons';
import { useClusterStore } from '@/store/useClusterStore';
import '@/openshift-components.css';

const exampleQueries = [
  { label: 'CPU Usage', query: 'rate(container_cpu_usage_seconds_total[5m])' },
  { label: 'Memory Usage', query: 'container_memory_working_set_bytes' },
  { label: 'Pod Count', query: 'count(kube_pod_info)' },
  { label: 'Node Load', query: 'node_load1' },
  { label: 'Network I/O', query: 'rate(node_network_receive_bytes_total[5m])' },
  { label: 'Disk Usage', query: 'node_filesystem_avail_bytes' },
];

function MiniChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data) - 5;
  const max = Math.max(...data) + 5;
  const w = 400;
  const h = 120;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  });
  const areaPoints = [...points, `${w},${h}`, `0,${h}`];
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="os-minichart">
      <defs>
        <linearGradient id={`metricGrad-${color.replace(/[^a-z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints.join(' ')} fill={`url(#metricGrad-${color.replace(/[^a-z0-9]/g, '')})`} />
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Metrics() {
  const [queryValue, setQueryValue] = React.useState('');
  const [activeQuery, setActiveQuery] = React.useState('');
  const { metrics, fetchClusterData, startPolling, stopPolling } = useClusterStore();

  useEffect(() => {
    fetchClusterData();
    startPolling();
    return () => stopPolling();
  }, [fetchClusterData, startPolling, stopPolling]);

  const runQuery = (q: string) => {
    setQueryValue(q);
    setActiveQuery(q);
  };

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">Metrics</Title>
        <p className="os-metrics__description">
          Query and visualize cluster metrics with PromQL
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <div className="os-metrics__query-row">
              <input
                className="os-metrics__query-input"
                placeholder="Enter PromQL query..."
                value={queryValue}
                onChange={(e) => setQueryValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setActiveQuery(queryValue)}
              />
              <Button variant="primary" icon={<PlayIcon />} onClick={() => setActiveQuery(queryValue)}>
                Run Query
              </Button>
            </div>

            <div className="os-metrics__quick-actions">
              {exampleQueries.map((eq) => (
                <button
                  key={eq.label}
                  className="compass-quick-action os-metrics__quick-action-btn"
                  onClick={() => runQuery(eq.query)}
                >
                  {eq.label}
                </button>
              ))}
            </div>

            {activeQuery && (
              <div className="os-metrics__results">
                <div className="os-metrics__results-label">
                  Results for: <code>{activeQuery}</code>
                </div>
                <MiniChart data={metrics.map((m) => m.cpu)} color="rgba(251, 146, 60, 0.8)" />
              </div>
            )}
          </CardBody>
        </Card>
      </PageSection>

      <PageSection>
        <Title headingLevel="h3" className="os-metrics__live-title">Live Cluster Metrics</Title>
        <Grid hasGutter>
          <GridItem md={6}>
            <Card>
              <CardBody>
                <div className="os-metrics__chart-title">CPU Utilization (%)</div>
                <MiniChart data={metrics.map((m) => m.cpu)} color="rgba(59, 130, 246, 0.8)" />
                <div className="os-metrics__chart-latest">
                  Latest: {metrics[metrics.length - 1]?.cpu ?? 0}%
                </div>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem md={6}>
            <Card>
              <CardBody>
                <div className="os-metrics__chart-title">Memory Utilization (%)</div>
                <MiniChart data={metrics.map((m) => m.memory)} color="rgba(34, 197, 94, 0.8)" />
                <div className="os-metrics__chart-latest">
                  Latest: {metrics[metrics.length - 1]?.memory ?? 0}%
                </div>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
}
