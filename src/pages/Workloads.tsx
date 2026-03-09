import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Workloads() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workloads</h1>
        <p className="text-muted-foreground">
          Manage deployments, pods, and other workload resources
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Workloads management coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
