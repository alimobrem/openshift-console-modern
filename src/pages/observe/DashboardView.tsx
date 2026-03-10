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

interface GrafanaTemplating {
  list?: { name: string; query?: string; current?: { value?: string }; type?: string }[];
}

interface PromResult {
  metric: Record<string, string>;
  values: [number, string][];
}

interface ChartData {
  title: string;
  series: { label: string; values: [number, string][] }[];
}

/**
 * Resolve Grafana template variables by fetching real values from the cluster.
 * Returns a map of $variable -> real_value
 */
async function resolveTemplateVariables(): Promise<Record<string, string>> {
  const vars: Record<string, string> = {};

  try {
    // Fetch first node name
    const nodesRes = await fetch(`${K8S_BASE}/api/v1/nodes?limit=1`);
    if (nodesRes.ok) {
      const nodesData = await nodesRes.json() as { items: { metadata: { name: string } }[] };
      const nodeName = nodesData.items[0]?.metadata.name ?? '';
      vars['$node'] = nodeName;
      vars['${node}'] = nodeName;
      vars['${node:pipe}'] = nodeName;
      vars['$instance'] = nodeName;
      vars['${instance}'] = nodeName;
      vars['${instance:pipe}'] = nodeName;
    }

    // Fetch first namespace with pods
    vars['$namespace'] = 'openshift-monitoring';
    vars['${namespace}'] = 'openshift-monitoring';
    vars['${namespace:pipe}'] = 'openshift-monitoring';

    // Common defaults
    vars['$cluster'] = '';
    vars['${cluster}'] = '';
    vars['${cluster:pipe}'] = '';
    vars['$type'] = 'Pod';
    vars['${type}'] = 'Pod';
    vars['$resolution'] = '5m';
    vars['${resolution}'] = '5m';
    vars['$__rate_interval'] = '5m';
    vars['${__rate_interval}'] = '5m';
    vars['$__interval'] = '1m';
    vars['${__interval}'] = '1m';
    vars['$workload'] = '.*';
    vars['${workload}'] = '.*';
    vars['$pod'] = '.*';
    vars['${pod}'] = '.*';
    vars['$container'] = '.*';
    vars['${container}'] = '.*';
    vars['$service'] = '.*';
    vars['${service}'] = '.*';
    vars['$job'] = '.*';
    vars['${job}'] = '.*';
    vars['$interval'] = '5m';
    vars['${interval}'] = '5m';
    vars['$datasource'] = 'prometheus';
    vars['${datasource}'] = 'prometheus';
    vars['$topk'] = '25';
    vars['${topk}'] = '25';
  } catch {
    // Ignore errors
  }

  return vars;
}

function substituteVariables(expr: string, vars: Record<string, string>): string {
  let result = expr;
  // Sort by key length descending to replace longer matches first
  const sortedKeys = Object.keys(vars).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const value = vars[key];
    if (value !== undefined) {
      result = result.split(key).join(value);
    }
  }
  // Handle any remaining ${var:...} patterns with regex
  result = result.replace(/\$\{[^}]+\}/g, '.*');
  result = result.replace(/\$[a-zA-Z_]\w*/g, '.*');
  return result;
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
  const colors = ['#0066cc', '#009596', '#3e8635', '#f0ab00', '#c9190b', '#5752d1', '#ec7a08', '#2b9af3', '#a18fff', '#73bcf7'];

  return (
    <Card>
      <CardBody>
        <div className="os-detail__section-title">{chart.title}</div>
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          {chart.series.slice(0, 10).map((series, si) => {
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
          {chart.series.slice(0, 4).map((s, i) => (
            <span key={i}>
              <Label color="blue">{s.label.slice(0, 40) || `series-${i}`}</Label>{' '}
            </span>
          ))}
          {chart.series.length > 4 && <span className="os-text-muted">+{chart.series.length - 4} more</span>}
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
        // Resolve template variables from cluster state
        const templateVars = await resolveTemplateVariables();

        // Fetch the ConfigMap containing the Grafana dashboard JSON
        const cmRes = await fetch(`${K8S_BASE}/api/v1/namespaces/openshift-config-managed/configmaps/${name}`);
        if (!cmRes.ok) { setLoading(false); return; }
        const cm = await cmRes.json() as { data?: Record<string, string> };

        // The dashboard JSON is stored in a key (usually the only key, or a .json key)
        const dataKeys = Object.keys(cm.data ?? {});
        const jsonKey = dataKeys.find((k) => k.endsWith('.json')) ?? dataKeys[0];
        if (!jsonKey || !cm.data) { setLoading(false); return; }

        const dashJson = JSON.parse(cm.data[jsonKey] ?? '{}') as {
          title?: string;
          panels?: GrafanaPanel[];
          rows?: { panels?: GrafanaPanel[] }[];
          templating?: GrafanaTemplating;
        };
        setDashTitle(dashJson.title ?? name ?? 'Dashboard');

        // Apply any dashboard-defined template defaults
        if (dashJson.templating?.list) {
          for (const tpl of dashJson.templating.list) {
            if (tpl.current?.value && !templateVars[`$${tpl.name}`]) {
              templateVars[`$${tpl.name}`] = tpl.current.value;
              templateVars[`\${${tpl.name}}`] = tpl.current.value;
            }
          }
        }

        // Extract panels - Grafana dashboards can have top-level panels or panels inside rows
        const allPanels: GrafanaPanel[] = [
          ...(dashJson.panels ?? []),
          ...(dashJson.rows ?? []).flatMap((r) => r.panels ?? []),
        ];

        // Filter to panels with PromQL targets
        const queryPanels = allPanels.filter((p) =>
          p.targets && p.targets.length > 0 && p.targets[0]?.expr
        );

        // Query Prometheus for each panel (limit to first 16 for performance)
        const end = Math.floor(Date.now() / 1000);
        const start = end - 3600; // last 1 hour
        const step = 60; // 1 minute resolution

        const chartData: ChartData[] = [];
        for (const panel of queryPanels.slice(0, 16)) {
          const target = panel.targets?.[0];
          if (!target?.expr) continue;

          try {
            // Substitute template variables in the PromQL expression
            const resolvedExpr = substituteVariables(target.expr, templateVars);
            const query = encodeURIComponent(resolvedExpr);
            const promRes = await fetch(
              `${PROM_BASE}/api/v1/query_range?query=${query}&start=${start}&end=${end}&step=${step}`
            );
            if (!promRes.ok) continue;
            const promData = await promRes.json() as { data?: { result?: PromResult[] } };
            const results = promData.data?.result ?? [];

            chartData.push({
              title: panel.title || resolvedExpr.slice(0, 50),
              series: results.slice(0, 10).map((r) => ({
                label: target.legendFormat
                  ? Object.entries(r.metric).reduce(
                      (fmt, [k, v]) => fmt.replace(`{{${k}}}`, v),
                      target.legendFormat
                    )
                  : Object.values(r.metric).slice(0, 3).join(' / ') || 'value',
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
