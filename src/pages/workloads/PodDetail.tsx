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
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { useParams } from 'react-router-dom';
import ResourceDetailPage from '@/components/ResourceDetailPage';
import StatusIndicator from '@/components/StatusIndicator';
import LogViewer from '@/components/LogViewer';
import '@/openshift-components.css';

export default function PodDetail() {
  const { namespace, name } = useParams();

  const pod = {
    name: name || 'frontend-7d8f9b5c4d-x7k2m',
    namespace: namespace || 'default',
    status: 'Running',
    podIP: '10.128.2.45',
    nodeIP: '192.168.1.10',
    nodeName: 'worker-0',
    created: '2026-02-28T10:15:30Z',
    labels: { app: 'frontend', 'pod-template-hash': '7d8f9b5c4d', version: 'v1.0.0' },
    containers: [
      { name: 'frontend', image: 'nginx:1.21', ready: true, restartCount: 0, state: 'Running', cpu: '10m', memory: '128Mi' },
    ],
    conditions: [
      { type: 'Initialized', status: 'True', lastTransition: '2026-02-28T10:15:30Z' },
      { type: 'Ready', status: 'True', lastTransition: '2026-02-28T10:15:35Z' },
      { type: 'ContainersReady', status: 'True', lastTransition: '2026-02-28T10:15:35Z' },
      { type: 'PodScheduled', status: 'True', lastTransition: '2026-02-28T10:15:30Z' },
    ],
    events: [
      { type: 'Normal', reason: 'Scheduled', message: `Successfully assigned ${namespace}/${name} to worker-0`, time: '2m' },
      { type: 'Normal', reason: 'Pulled', message: 'Container image "nginx:1.21" already present on machine', time: '2m' },
      { type: 'Normal', reason: 'Created', message: 'Created container frontend', time: '2m' },
      { type: 'Normal', reason: 'Started', message: 'Started container frontend', time: '2m' },
    ],
  };

  const yamlContent = `apiVersion: v1
kind: Pod
metadata:
  name: ${pod.name}
  namespace: ${pod.namespace}
  labels:
    app: frontend
    pod-template-hash: 7d8f9b5c4d
    version: v1.0.0
spec:
  containers:
  - name: frontend
    image: nginx:1.21
    resources:
      limits:
        cpu: 100m
        memory: 256Mi
      requests:
        cpu: 10m
        memory: 128Mi
status:
  phase: Running
  podIP: ${pod.podIP}
  hostIP: ${pod.nodeIP}`;

  const detailsTab = (
    <Grid hasGutter>
      <GridItem md={6}>
        <Card>
          <CardBody>
            <Title headingLevel="h3" size="lg" className="os-detail__section-title">Pod Details</Title>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription><strong>{pod.name}</strong></DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Namespace</DescriptionListTerm>
                <DescriptionListDescription>{pod.namespace}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription><StatusIndicator status={pod.status} /></DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Pod IP</DescriptionListTerm>
                <DescriptionListDescription><code>{pod.podIP}</code></DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Node</DescriptionListTerm>
                <DescriptionListDescription>{pod.nodeName}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Node IP</DescriptionListTerm>
                <DescriptionListDescription><code>{pod.nodeIP}</code></DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Created</DescriptionListTerm>
                <DescriptionListDescription>{pod.created}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>
        <Card className="os-detail__card--spaced">
          <CardBody>
            <Title headingLevel="h3" size="lg" className="os-detail__section-title">Labels</Title>
            <div className="os-detail__labels-wrap">
              {Object.entries(pod.labels).map(([key, value]) => (
                <Label key={key} color="blue"><code className="os-detail__label-code">{key}={value}</code></Label>
              ))}
            </div>
          </CardBody>
        </Card>
      </GridItem>
      <GridItem md={6}>
        <Card>
          <CardBody>
            <Title headingLevel="h3" size="lg" className="os-detail__section-title">Containers</Title>
            {pod.containers.map((c) => (
              <DescriptionList key={c.name}>
                <DescriptionListGroup>
                  <DescriptionListTerm>Name</DescriptionListTerm>
                  <DescriptionListDescription><strong>{c.name}</strong></DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Image</DescriptionListTerm>
                  <DescriptionListDescription><code>{c.image}</code></DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>State</DescriptionListTerm>
                  <DescriptionListDescription><StatusIndicator status={c.state} /></DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Restart Count</DescriptionListTerm>
                  <DescriptionListDescription>{c.restartCount}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Resources</DescriptionListTerm>
                  <DescriptionListDescription>CPU: {c.cpu}, Memory: {c.memory}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            ))}
          </CardBody>
        </Card>
        <Card className="os-detail__card--spaced">
          <CardBody>
            <Title headingLevel="h3" size="lg" className="os-detail__section-title">Conditions</Title>
            <Table aria-label="Conditions table" variant="compact">
              <Thead><Tr><Th>Type</Th><Th>Status</Th><Th>Last Transition</Th></Tr></Thead>
              <Tbody>
                {pod.conditions.map((c) => (
                  <Tr key={c.type}>
                    <Td>{c.type}</Td>
                    <Td><StatusIndicator status={c.status} /></Td>
                    <Td>{c.lastTransition}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );

  const eventsTab = (
    <Card>
      <CardBody>
        <Table aria-label="Events table" variant="compact">
          <Thead><Tr><Th>Type</Th><Th>Reason</Th><Th>Message</Th><Th>Time</Th></Tr></Thead>
          <Tbody>
            {pod.events.map((e, i) => (
              <Tr key={i}>
                <Td><StatusIndicator status={e.type} /></Td>
                <Td><strong>{e.reason}</strong></Td>
                <Td>{e.message}</Td>
                <Td>{e.time}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );

  const logsTab = (
    <LogViewer
      podName={pod.name}
      namespace={pod.namespace}
      containers={pod.containers.map((c) => c.name)}
    />
  );

  return (
    <ResourceDetailPage
      kind="Pod"
      name={pod.name}
      namespace={pod.namespace}
      status={pod.status}
      backPath="/workloads/pods"
      backLabel="Pods"
      yaml={yamlContent}
      tabs={[
        { title: 'Details', content: detailsTab },
        { title: 'Events', content: eventsTab },
        { title: 'Logs', content: logsTab },
      ]}
    />
  );
}
