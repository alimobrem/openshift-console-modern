import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Networking() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Networking</h1>
        <p className="text-muted-foreground">
          Configure services, routes, and network policies
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Networking configuration coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
