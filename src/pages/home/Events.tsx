import { useEffect } from 'react';
import ResourceListPage, { type ColumnDef } from '@/components/ResourceListPage';
import { useClusterStore, type Event } from '@/store/useClusterStore';
import StatusIndicator from '@/components/StatusIndicator';

const columns: ColumnDef<Event>[] = [
  { title: 'Type', key: 'type', render: (e) => <StatusIndicator status={e.type} /> },
  { title: 'Reason', key: 'reason', render: (e) => <strong>{e.reason}</strong> },
  { title: 'Message', key: 'message' },
  { title: 'Namespace', key: 'namespace' },
  { title: 'Time', key: 'timestamp', render: (e) => new Date(e.timestamp).toLocaleTimeString() },
];

export default function Events() {
  const { events, fetchClusterData, startPolling, stopPolling } = useClusterStore();

  useEffect(() => {
    fetchClusterData();
    startPolling();
    return () => stopPolling();
  }, [fetchClusterData, startPolling, stopPolling]);

  return (
    <ResourceListPage
      title="Events"
      description="View cluster-wide events and activity in real time"
      columns={columns}
      data={events}
      getRowKey={(e) => `${e.timestamp}-${e.reason}-${e.namespace}`}
      nameField="reason"
      filterFn={(e, s) => {
        const q = s.toLowerCase();
        return e.reason.toLowerCase().includes(q) ||
          e.message.toLowerCase().includes(q) ||
          e.namespace.toLowerCase().includes(q);
      }}
    />
  );
}
