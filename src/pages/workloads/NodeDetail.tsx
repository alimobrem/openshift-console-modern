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

export default function NodeDetail() {
  const { name } = useParams();

  const node = {
    name: name || 'worker-0',
    status: 'Ready',
    role: 'worker',
    version: 'v1.28.5',
    osImage: 'Red Hat Enterprise Linux CoreOS 414.92.202402201450-0',
    kernelVersion: '5.14.0-362.18.1.el9_3.x86_64',
    containerRuntime: 'cri-o://1.28.3',
    internalIP: '192.168.1.10',
    externalIP: '203.0.113.10',
    hostname: 'worker-0.cluster.local',
    cpu: { capacity: '4', allocatable: '3800m', usage: 45 },
    memory: { capacity: '16Gi', allocatable: '15.5Gi', usage: 62 },
    podCapacity: { capacity: 250, current: 35 },
    created: '2025-09-15T10:00:00Z',
    labels: {
      'kubernetes.io/hostname': 'worker-0',
      'node-role.kubernetes.io/worker': '',
      'topology.kubernetes.io/zone': 'us-east-1a',
    },
    conditions: [
      { type: 'Ready', status: 'True', message: 'kubelet is posting ready status' },
      { type: 'MemoryPressure', status: 'False', message: 'kubelet has sufficient memory available' },
      { type: 'DiskPressure', status: 'False', message: 'kubelet has no disk pressure' },
      { type: 'PIDPressure', status: 'False', message: 'kubelet has sufficient PID available' },
      { type: 'NetworkUnavailable', status: 'False', message: 'RouteController created a route' },
    ],
    pods: [
      { name: 'frontend-7d8f9b5c4d-x7k2m', namespace: 'default', status: 'Running', cpu: '10m', memory: '128Mi' },
      { name: 'backend-api-5d6c8b7f9d-p4t8h', namespace: 'default', status: 'Running', cpu: '25m', memory: '256Mi' },
      { name: 'fluentd-abc123', namespace: 'kube-system', status: 'Running', cpu: '100m', memory: '512Mi' },
    ],
  };

  const yamlContent = `apiVersion: v1
kind: Node
metadata:
  name: ${node.name}
  labels:
    kubernetes.io/hostname: ${node.name}
    node-role.kubernetes.io/worker: ""
    topology.kubernetes.io/zone: us-east-1a
spec:
  podCIDR: 10.128.2.0/24
status:
  capacity:
    cpu: "${node.cpu.capacity}"
    memory: ${node.memory.capacity}
    pods: "${node.podCapacity.capacity}"
  allocatable:
    cpu: ${node.cpu.allocatable}
    memory: ${node.memory.allocatable}
  nodeInfo:
    kubeletVersion: ${node.version}
    osImage: "${node.osImage}"
    kernelVersion: ${node.kernelVersion}
    containerRuntimeVersion: ${node.containerRuntime}`;

  const getProgressVariant = (v: number) =>
    v > 80 ? ProgressVariant.danger : v > 60 ? ProgressVariant.warning : ProgressVariant.success;

  const detailsTab = (
    <Grid hasGutter>
      <GridItem md={6}>
        <Card>
          <CardBody>
            <Title headingLevel="h3" size="lg" className="os-detail__section-title">Node Information</Title>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription><strong>{node.name}</strong></DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription><StatusIndicator status={node.status} /></DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Role</DescriptionListTerm>
                <DescriptionListDescription><Label color="blue">{node.role}</Label></DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Kubernetes Version</DescriptionListTerm>
                <DescriptionListDescription><code>{node.version}</code></DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Internal IP</DescriptionListTerm>
                <DescriptionListDescription><code>{node.internalIP}</code></DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>External IP</DescriptionListTerm>
                <DescriptionListDescription><code>{node.externalIP}</code></DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Hostname</DescriptionListTerm>
                <DescriptionListDescription>{node.hostname}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>OS Image</DescriptionListTerm>
                <DescriptionListDescription>{node.osImage}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Container Runtime</DescriptionListTerm>
                <DescriptionListDescription><code>{node.containerRuntime}</code></DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>
      </GridItem>
      <GridItem md={6}>
        <Card>
          <CardBody>
            <Title headingLevel="h3" size="lg" className="os-detail__section-title">Resource Utilization</Title>
            <div className="os-node__resource-section">
              <div className="os-node__resource-header">
                <strong>CPU Usage</strong><span>{node.cpu.usage}%</span>
              </div>
              <Progress value={node.cpu.usage} title="CPU" variant={getProgressVariant(node.cpu.usage)} />
              <div className="os-node__resource-detail">
                Allocatable: {node.cpu.allocatable} / Capacity: {node.cpu.capacity}
              </div>
            </div>
            <div className="os-node__resource-section">
              <div className="os-node__resource-header">
                <strong>Memory Usage</strong><span>{node.memory.usage}%</span>
              </div>
              <Progress value={node.memory.usage} title="Memory" variant={getProgressVariant(node.memory.usage)} />
              <div className="os-node__resource-detail">
                Allocatable: {node.memory.allocatable} / Capacity: {node.memory.capacity}
              </div>
            </div>
            <div>
              <div className="os-node__resource-header">
                <strong>Pod Usage</strong><span>{node.podCapacity.current} / {node.podCapacity.capacity}</span>
              </div>
              <Progress value={(node.podCapacity.current / node.podCapacity.capacity) * 100} title="Pods" variant={ProgressVariant.success} />
            </div>
          </CardBody>
        </Card>
        <Card className="os-detail__card--spaced">
          <CardBody>
            <Title headingLevel="h3" size="lg" className="os-detail__section-title">Conditions</Title>
            {node.conditions.map((c) => (
              <div key={c.type} className="os-node__condition">
                <div className="os-node__condition-header">
                  <strong>{c.type}</strong>
                  <StatusIndicator status={c.status} />
                </div>
                <div className="os-node__condition-message">{c.message}</div>
              </div>
            ))}
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );

  const podsTab = (
    <Card>
      <CardBody>
        <Table aria-label="Pods table" variant="compact">
          <Thead><Tr><Th>Name</Th><Th>Namespace</Th><Th>Status</Th><Th>CPU</Th><Th>Memory</Th></Tr></Thead>
          <Tbody>
            {node.pods.map((p) => (
              <Tr key={p.name}>
                <Td><strong>{p.name}</strong></Td>
                <Td>{p.namespace}</Td>
                <Td><StatusIndicator status={p.status} /></Td>
                <Td>{p.cpu}</Td>
                <Td>{p.memory}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );

  return (
    <ResourceDetailPage
      kind="Node"
      name={node.name}
      status={node.status}
      statusExtra={<Label color="blue">{node.role}</Label>}
      backPath="/compute/nodes"
      backLabel="Nodes"
      yaml={yamlContent}
      tabs={[
        { title: 'Details', content: detailsTab },
        { title: 'Pods', content: podsTab },
      ]}
    />
  );
}
