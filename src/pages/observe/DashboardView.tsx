import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Breadcrumb,
  BreadcrumbItem,
  Grid,
  GridItem,
  Label,
} from '@patternfly/react-core';
import '@/openshift-components.css';

const K8S_BASE = '/api/kubernetes';
const PROM_BASE = '/api/prometheus';

interface GrafanaPanel {
  title: string;
  type: string;
  targets?: { expr: string; legendFormat?: string }[];
}

interface PromResult {
  metric: Record<string, string>;
  values: [number, string][];
}

interface ChartData {
  title: string;
  series: { label: string; values: [number, string][] }[];
}

function PromChart({ chart }: { chart: ChartData }) {
  if (chart.series.length === 0 || chart.series[0]?.values.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="os-detail__section-title">{chart.title}</div>
          <p className="os-text-muted">No data</p>
        </CardBody>
      </Card>
    );
  }

  const allValues = chart.series.flatMap((s) => s.values.map((v) => parseFloat(v[1])));
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const w = 500;
  const h = 120;
  const colors = ['#0066cc', '#009596', '#3e8635', '#f0ab00', '#c9190b', '#5752d1'];

  return (
    <Card>
      <CardBody>
        <div className="os-detail__section-title">{chart.title}</div>
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          {chart.series.slice(0, 6).map((series, si) => {
            const points = series.values.map((v, i) => {
              const x = (i / (series.values.length - 1)) * w;
              const y = h - ((parseFloat(v[1]) - min) / range) * (h - 10) - 5;
              return `${x},${y}`;
            });
            const color = colors[si % colors.length] ?? '#0066cc';
            return (
              <polyline
                key={si}
                points={points.join(' ')}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </svg>
        <div className="os-text-muted">
          {chart.series.slice(0, 3).map((s, i) => (
            <span key={i}>
              <Label color="blue">{s.label || `series-${i}`}</Label>{' '}
            </span>
          ))}
          {chart.series.length > 3 && <span className="os-text-muted">+{chart.series.length - 3} more</span>}
        </div>
      </CardBody>
    </Card>
  );
}

export default function DashboardView() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [panels, setPanels] = useState<ChartData[]>([]);
  const [dashTitle, setDashTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch the ConfigMap containing the Grafana dashboard JSON
        const cmRes = await fetch(`${K8S_BASE}/api/v1/namespaces/openshift-config-managed/configmaps/${name}`);
        if (!cmRes.ok) { setLoading(false); return; }
        const cm = await cmRes.json() as { data?: Record<string, string> };

        // The dashboard JSON is stored in a key (usually the only key, or a .json key)
        const dataKeys = Object.keys(cm.data ?? {});
        const jsonKey = dataKeys.find((k) => k.endsWith('.json')) ?? dataKeys[0];
        if (!jsonKey || !cm.data) { setLoading(false); return; }

        const dashJson = JSON.parse(cm.data[jsonKey] ?? '{}') as { title?: string; panels?: GrafanaPanel[]; rows?: { panels?: GrafanaPanel[] }[] };
        setDashTitle(dashJson.title ?? name ?? 'Dashboard');

        // Extract panels - Grafana dashboards can have top-level panels or panels inside rows
        const allPanels: GrafanaPanel[] = [
          ...(dashJson.panels ?? []),
          ...(dashJson.rows ?? []).flatMap((r) => r.panels ?? []),
        ];

        // Filter to panels with PromQL targets
        const queryPanels = allPanels.filter((p) =>
          p.targets && p.targets.length > 0 && p.targets[0]?.expr
        );

        // Query Prometheus for each panel (limit to first 12 for performance)
        const end = Math.floor(Date.now() / 1000);
        const start = end - 3600; // last 1 hour
        const step = 60; // 1 minute resolution

        const chartData: ChartData[] = [];
        for (const panel of queryPanels.slice(0, 12)) {
          const target = panel.targets?.[0];
          if (!target?.expr) continue;

          try {
            const query = encodeURIComponent(target.expr);
            const promRes = await fetch(
              `${PROM_BASE}/api/v1/query_range?query=${query}&start=${start}&end=${end}&step=${step}`
            );
            if (!promRes.ok) continue;
            const promData = await promRes.json() as { data?: { result?: PromResult[] } };
            const results = promData.data?.result ?? [];

            chartData.push({
              title: panel.title || target.expr.slice(0, 50),
              series: results.slice(0, 10).map((r) => ({
                label: target.legendFormat
                  ? Object.entries(r.metric).reduce(
                      (fmt, [k, v]) => fmt.replace(`{{${k}}}`, v),
                      target.legendFormat
                    )
                  : Object.values(r.metric).join(' / ') || 'value',
                values: r.values,
              })),
            });
          } catch {
            // Query may fail
          }
        }

        setPanels(chartData);
      } catch {
        // API may not be available
      }
      setLoading(false);
    }
    load();
  }, [name]);

  return (
    <>
      <PageSection variant="default">
        <Breadcrumb>
          <BreadcrumbItem to="#" onClick={() => navigate('/observe/dashboards')}>
            Dashboards
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{dashTitle || name}</BreadcrumbItem>
        </Breadcrumb>
        <Title headingLevel="h1" size="2xl">{dashTitle || name}</Title>
        <p className="os-list__description">
          {panels.length} panels with live Prometheus data (last 1 hour)
        </p>
      </PageSection>

      <PageSection>
        {loading ? (
          <p className="os-text-muted">Loading dashboard and querying Prometheus...</p>
        ) : panels.length === 0 ? (
          <Card>
            <CardBody>
              <p className="os-text-muted">No chart data available. The dashboard may not have PromQL queries or Prometheus may not be accessible.</p>
            </CardBody>
          </Card>
        ) : (
          <Grid hasGutter>
            {panels.map((chart, i) => (
              <GridItem key={i} md={6}>
                <PromChart chart={chart} />
              </GridItem>
            ))}
          </Grid>
        )}
      </PageSection>
    </>
  );
}
