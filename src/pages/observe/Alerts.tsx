import React from 'react';
import { Button } from '@patternfly/react-core';
import ResourceListPage, { type ColumnDef } from '@/components/ResourceListPage';
import StatusIndicator from '@/components/StatusIndicator';
import { useUIStore } from '@/store/useUIStore';
import '@/openshift-components.css';

interface Alert {
  name: string;
  severity: string;
  state: string;
  message: string;
  source: string;
  activeSince: string;
}

const initialData: Alert[] = [
  { name: 'HighPodMemoryUsage', severity: 'warning', state: 'firing', message: 'Pod memory usage is above 90%', source: 'prometheus', activeSince: '2h' },
  { name: 'NodeDiskPressure', severity: 'critical', state: 'firing', message: 'Node disk usage is above 95%', source: 'node-exporter', activeSince: '30m' },
  { name: 'PodCrashLooping', severity: 'critical', state: 'pending', message: 'Pod is crash looping', source: 'prometheus', activeSince: '15m' },
  { name: 'APIServerLatency', severity: 'warning', state: 'inactive', message: 'API server latency is high', source: 'kube-apiserver', activeSince: '-' },
  { name: 'EtcdHighCommitDuration', severity: 'info', state: 'inactive', message: 'Etcd commit duration is elevated', source: 'etcd', activeSince: '-' },
];

function AlertActions({ alert, onSilence }: { alert: Alert; onSilence: (name: string) => void }) {
  const addToast = useUIStore((s) => s.addToast);

  if (alert.state === 'inactive') return <span className="os-alerts__inactive">-</span>;

  return (
    <span className="os-alerts__actions" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          onSilence(alert.name);
          addToast({ type: 'success', title: `Alert silenced`, description: `${alert.name} has been silenced for 2 hours` });
        }}
      >
        Silence
      </Button>
    </span>
  );
}

export default function Alerts() {
  const [data, setData] = React.useState(initialData);

  const handleSilence = (name: string) => {
    setData((prev) => prev.map((a) =>
      a.name === name ? { ...a, state: 'inactive' } : a
    ));
  };

  const columns: ColumnDef<Alert>[] = [
    { title: 'Alert', key: 'name' },
    { title: 'Severity', key: 'severity', render: (a) => <StatusIndicator status={a.severity} /> },
    { title: 'State', key: 'state', render: (a) => <StatusIndicator status={a.state} /> },
    { title: 'Message', key: 'message' },
    { title: 'Source', key: 'source' },
    { title: 'Actions', key: 'actions', render: (a) => <AlertActions alert={a} onSilence={handleSilence} />, sortable: false },
  ];

  return (
    <ResourceListPage
      title="Alerts"
      description="View and manage cluster alerting rules"
      columns={columns}
      data={data}
      getRowKey={(a) => a.name}
      nameField="name"
    />
  );
}
