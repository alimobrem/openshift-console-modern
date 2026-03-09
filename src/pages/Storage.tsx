import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Storage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Storage</h1>
        <p className="text-muted-foreground">
          Manage persistent volumes and storage classes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Persistent Volumes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Storage management coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
