import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useClusterStore } from '@/store/useClusterStore';
import { Activity, Server, Package, AlertCircle } from 'lucide-react';

export default function Overview() {
  const { nodes, pods, fetchClusterData } = useClusterStore();

  useEffect(() => {
    fetchClusterData();
  }, [fetchClusterData]);

  const stats = {
    totalNodes: nodes.length,
    readyNodes: nodes.filter((n) => n.status === 'Ready').length,
    totalPods: pods.length,
    runningPods: pods.filter((p) => p.status === 'Running').length,
    failedPods: pods.filter((p) => p.status === 'Failed').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cluster Overview</h1>
        <p className="text-muted-foreground">
          Monitor your OpenShift cluster health and resources
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNodes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.readyNodes} ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Pods</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.runningPods}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalPods} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Pods</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedPods}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cluster Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nodes</CardTitle>
            <CardDescription>Cluster node status and utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nodes.map((node) => (
                <div key={node.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        node.status === 'Ready' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="font-medium">{node.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    CPU: {node.cpu}% | Memory: {node.memory}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Pods</CardTitle>
            <CardDescription>Latest pod deployments and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pods.slice(0, 5).map((pod) => (
                <div key={pod.name} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{pod.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {pod.namespace}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        pod.status === 'Running'
                          ? 'bg-green-100 text-green-700'
                          : pod.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {pod.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
