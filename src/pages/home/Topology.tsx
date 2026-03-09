import { useEffect } from 'react';
import TopologyView from '@/components/TopologyView';
import { useClusterStore } from '@/store/useClusterStore';

export default function Topology() {
  const { fetchClusterData, startPolling, stopPolling } = useClusterStore();

  useEffect(() => {
    fetchClusterData();
    startPolling();
    return () => stopPolling();
  }, [fetchClusterData, startPolling, stopPolling]);

  return <TopologyView />;
}
