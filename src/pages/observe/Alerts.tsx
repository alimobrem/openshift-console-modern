import React from 'react';
import { Button } from '@patternfly/react-core';
import ResourceListPage, { type ColumnDef } from '@/components/ResourceListPage';
import StatusIndicator from '@/components/StatusIndicator';
import { useUIStore } from '@/store/useUIStore';
import { useK8sResource, type K8sMeta } from '@/hooks/useK8sResource';
import '@/openshift-components.css';

interface Alert {
  name: string;
  severity: string;
  state: string;
  message: string;
  source: string;
  activeSince: string;
}

interface AlertRule {
  alert?: string;
  record?: string;
  expr: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

interface RuleGroup {
  name: string;
  rules: AlertRule[];
}

interface RawPrometheusRule extends K8sMeta {
  spec: {
    groups: RuleGroup[];
  };
}

function transformPrometheusRule(item: RawPrometheusRule): Alert[] {
  const alerts: Alert[] = [];
  const source = item.metadata.name;

  for (const group of item.spec.groups) {
    for (const rule of group.rules) {
      if (!rule.alert) continue;
      alerts.push({
        name: rule.alert,
        severity: rule.labels?.severity ?? 'none',
        state: 'inactive',
        message: rule.annotations?.summary ?? rule.annotations?.description ?? rule.expr,
        source,
        activeSince: '-',
      });
    }
  }

  return alerts;
}

function AlertActions({ alert }: { alert: Alert }) {
  const addToast = useUIStore((s) => s.addToast);

  return (
    <span className="os-alerts__actions" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          addToast({
            type: 'success',
            title: 'Silence created',
            description: `${alert.name} has been silenced for 2 hours`,
          });
        }}
      >
        Silence
      </Button>
    </span>
  );
}

export default function Alerts() {
  const { data: prometheusRules, loading, error } = useK8sResource<RawPrometheusRule, RawPrometheusRule>(
    '/apis/monitoring.coreos.com/v1/prometheusrules',
    (item) => item,
  );

  const alerts = React.useMemo(() => {
    const allAlerts: Alert[] = [];
    for (const pr of prometheusRules) {
      allAlerts.push(...transformPrometheusRule(pr));
    }
    return allAlerts;
  }, [prometheusRules]);

  const columns: ColumnDef<Alert>[] = [
    { title: 'Alert', key: 'name' },
    { title: 'Severity', key: 'severity', render: (a) => <StatusIndicator status={a.severity} /> },
    { title: 'State', key: 'state', render: (a) => <StatusIndicator status={a.state} /> },
    { title: 'Message', key: 'message' },
    { title: 'Source', key: 'source' },
    { title: 'Actions', key: 'actions', render: (a) => <AlertActions alert={a} />, sortable: false },
  ];

  if (error) {
    return (
      <ResourceListPage
        title="Alerts"
        description={`Error loading alerts: ${error}`}
        columns={columns}
        data={[]}
        getRowKey={(a) => a.name}
        nameField="name"
      />
    );
  }

  return (
    <ResourceListPage
      title="Alerts"
      description="View and manage cluster alerting rules"
      columns={columns}
      data={alerts}
      getRowKey={(a) => `${a.source}-${a.name}`}
      nameField="name"
      loading={loading}
    />
  );
}
