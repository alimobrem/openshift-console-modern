import {
  Card,
  CardBody,
  Grid,
  GridItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
  Title,
  Progress,
  ProgressVariant,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { useParams } from 'react-router-dom';
import ResourceDetailPage from '@/components/ResourceDetailPage';
import StatusIndicator from '@/components/StatusIndicator';
import '@/openshift-components.css';

export default function DeploymentDetail() {
  const { namespace, name } = useParams();

  const deployment = {
    name: name || 'frontend',
    namespace: namespace || 'default',
    replicas: { desired: 3, current: 3, ready: 3, available: 3 },
    strategy: 'RollingUpdate',
    maxSurge: '25%',
    maxUnavailable: '25%',
    selector: 'app=frontend',
    created: '2026-01-15T10:00:00Z',
    labels: { app: 'frontend', version: 'v1.0.0' },
    conditions: [
      { type: 'Available', status: 'True', reason: 'MinimumReplicasAvailable', message: 'Deployment has minimum availability' },
      { type: 'Progressing', status: 'True', reason: 'NewReplicaSetAvailable', message: 'ReplicaSet "frontend-7d8f9b5c4d" has successfully progressed' },
    ],
    replicaSets: [
      { name: 'frontend-7d8f9b5c4d', replicas: '3/3', age: '2d', images: 'nginx:1.21' },
      { name: 'frontend-6c5b8a9e3f', replicas: '0/0', age: '5d', images: 'nginx:1.20' },
    ],
    pods: [
      { name: 'frontend-7d8f9b5c4d-x7k2m', status: 'Running', restarts: 0, age: '2d' },
      { name: 'frontend-7d8f9b5c4d-p4t8h', status: 'Running', restarts: 0, age: '2d' },
      { name: 'frontend-7d8f9b5c4d-m9n5j', status: 'Running', restarts: 0, age: '2d' },
    ],
  };

  const yamlContent = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${deployment.name}
  namespace: ${deployment.namespace}
  labels:
    app: frontend
    version: v1.0.0
spec:
  replicas: ${deployment.replicas.desired}
  selector:
    matchLabels:
      app: frontend
  strategy:
    type: ${deployment.strategy}
    rollingUpdate:
      maxSurge: ${deployment.maxSurge}
      maxUnavailable: ${deployment.maxUnavailable}
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: nginx:1.21
        ports:
        - containerPort: 80
        - containerPort: 443`;

  const detailsTab = (
    <Grid hasGutter>
      <GridItem md={6}>
        <Card>
          <CardBody>
            <Title headingLevel="h3" size="lg" className="os-detail__section-title">Deployment Details</Title>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription><strong>{deployment.name}</strong></DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Namespace</DescriptionListTerm>
                <DescriptionListDescription>{deployment.namespace}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Strategy</DescriptionListTerm>
                <DescriptionListDescription><Label color="blue">{deployment.strategy}</Label></DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Max Surge</DescriptionListTerm>
                <DescriptionListDescription>{deployment.maxSurge}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Max Unavailable</DescriptionListTerm>
                <DescriptionListDescription>{deployment.maxUnavailable}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Selector</DescriptionListTerm>
                <DescriptionListDescription><code>{deployment.selector}</code></DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Created</DescriptionListTerm>
                <DescriptionListDescription>{deployment.created}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>
        <Card className="os-detail__card--spaced">
          <CardBody>
            <Title headingLevel="h3" size="lg" className="os-detail__section-title">Replica Status</Title>
            <Grid hasGutter>
              <GridItem span={6}>
                <div className="os-deployment__replica-label">Desired</div>
                <Title headingLevel="h2" size="xl">{deployment.replicas.desired}</Title>
              </GridItem>
              <GridItem span={6}>
                <div className="os-deployment__replica-label">Ready</div>
                <Title headingLevel="h2" size="xl">{deployment.replicas.ready}</Title>
              </GridItem>
              <GridItem span={12}>
                <Progress value={(deployment.replicas.ready / deployment.replicas.desired) * 100} title="Replica availability" variant={ProgressVariant.success} />
              </GridItem>
            </Grid>
          </CardBody>
        </Card>
      </GridItem>
      <GridItem md={6}>
        <Card>
          <CardBody>
            <Title headingLevel="h3" size="lg" className="os-detail__section-title">Conditions</Title>
            {deployment.conditions.map((c) => (
              <div key={c.type} className="os-deployment__condition">
                <div className="os-deployment__condition-header">
                  <strong>{c.type}</strong>
                  <StatusIndicator status={c.status} />
                </div>
                <div className="os-deployment__condition-message">{c.message}</div>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card className="os-detail__card--spaced">
          <CardBody>
            <Title headingLevel="h3" size="lg" className="os-detail__section-title">ReplicaSets</Title>
            <Table aria-label="ReplicaSets table" variant="compact">
              <Thead><Tr><Th>Name</Th><Th>Replicas</Th><Th>Age</Th></Tr></Thead>
              <Tbody>
                {deployment.replicaSets.map((rs) => (
                  <Tr key={rs.name}>
                    <Td>{rs.name}</Td>
                    <Td><Label color={rs.replicas === '3/3' ? 'green' : 'grey'}>{rs.replicas}</Label></Td>
                    <Td>{rs.age}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );

  const podsTab = (
    <Card>
      <CardBody>
        <Table aria-label="Pods table" variant="compact">
          <Thead><Tr><Th>Name</Th><Th>Status</Th><Th>Restarts</Th><Th>Age</Th></Tr></Thead>
          <Tbody>
            {deployment.pods.map((p) => (
              <Tr key={p.name}>
                <Td><strong>{p.name}</strong></Td>
                <Td><StatusIndicator status={p.status} /></Td>
                <Td>{p.restarts}</Td>
                <Td>{p.age}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );

  return (
    <ResourceDetailPage
      kind="Deployment"
      name={deployment.name}
      namespace={deployment.namespace}
      status="Available"
      backPath="/workloads/deployments"
      backLabel="Deployments"
      yaml={yamlContent}
      tabs={[
        { title: 'Details', content: detailsTab },
        { title: 'Pods', content: podsTab },
      ]}
    />
  );
}
