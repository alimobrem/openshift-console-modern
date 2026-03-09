import { useState, useEffect } from 'react';

interface UseK8sResourceResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const BASE = '/api/kubernetes';

async function fetchList<T>(path: string): Promise<T[]> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const json = await res.json() as { items: T[] };
  return json.items ?? [];
}

export function useK8sResource<TRaw, TOut>(
  apiPath: string,
  transform: (item: TRaw) => TOut,
  pollInterval?: number,
): UseK8sResourceResult<TOut> {
  const [data, setData] = useState<TOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const items = await fetchList<TRaw>(apiPath);
        if (!cancelled) {
          setData(items.map(transform));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    let interval: ReturnType<typeof setInterval> | undefined;
    if (pollInterval) {
      interval = setInterval(load, pollInterval);
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [apiPath, tick]);

  return { data, loading, error, refetch };
}

// Helper to compute age from timestamp
export function ageFromTimestamp(ts: string | undefined): string {
  if (!ts) return '-';
  const diff = Date.now() - new Date(ts).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(diff / 60000);
  return `${mins}m`;
}

// Common K8s metadata shape
export interface K8sMeta {
  metadata: {
    name: string;
    namespace?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    uid?: string;
  };
}
