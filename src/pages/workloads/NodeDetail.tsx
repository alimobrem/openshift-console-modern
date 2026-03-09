import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Breadcrumb,
  BreadcrumbItem,
  Card,
  CardBody,
  Grid,
  GridItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
  Tabs,
  Tab,
  TabTitleText,
  Button,
  CodeBlock,
  CodeBlockCode,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Progress,
  ProgressVariant,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { TrashIcon, EditIcon } from '@patternfly/react-icons';

export default function NodeDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);

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
    pods: { capacity: 250, current: 35 },
    created: '2025-09-15T10:00:00Z',
    labels: {
      'kubernetes.io/hostname': 'worker-0',
      'node-role.kubernetes.io/worker': '',
      'topology.kubernetes.io/zone': 'us-east-1a',
    },
    conditions: [
      { type: 'Ready', status: 'True', reason: 'KubeletReady', message: 'kubelet is posting ready status' },
      { type: 'MemoryPressure', status: 'False', reason: 'KubeletHasSufficientMemory', message: 'kubelet has sufficient memory available' },
      { type: 'DiskPressure', status: 'False', reason: 'KubeletHasNoDiskPressure', message: 'kubelet has no disk pressure' },
      { type: 'PIDPressure', status: 'False', reason: 'KubeletHasSufficientPID', message: 'kubelet has sufficient PID available' },
      { type: 'NetworkUnavailable', status: 'False', reason: 'RouteCreated', message: 'RouteController created a route' },
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
    pods: "${node.pods.capacity}"
  allocatable:
    cpu: ${node.cpu.allocatable}
    memory: ${node.memory.allocatable}
  nodeInfo:
    kubeletVersion: ${node.version}
    osImage: "${node.osImage}"
    kernelVersion: ${node.kernelVersion}
    containerRuntimeVersion: ${node.containerRuntime}`;

  return (
    <>
      <PageSection variant="light">
        <Breadcrumb>
          <BreadcrumbItem to="#" onClick={() => navigate('/compute/nodes')}>
            Nodes
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{node.name}</BreadcrumbItem>
        </Breadcrumb>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div>
            <Title headingLevel="h1" size="2xl">
              {node.name}
            </Title>
            <div style={{ marginTop: '8px' }}>
              <Label color="green">{node.status}</Label>
              <Label color="blue" style={{ marginLeft: '8px' }}>
                {node.role}
              </Label>
            </div>
          </div>
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <Button variant="secondary" icon={<EditIcon />}>
                  Edit
                </Button>
              </ToolbarItem>
              <ToolbarItem>
                <Button variant="danger" icon={<TrashIcon />}>
                  Delete
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
        </div>
      </PageSection>

      <PageSection>
        <Tabs activeKey={activeTabKey} onSelect={(_, tabIndex) => setActiveTabKey(tabIndex)}>
          <Tab eventKey={0} title={<TabTitleText>Details</TabTitleText>}>
            <div style={{ marginTop: '24px' }}>
              <Grid hasGutter>
                <GridItem md={6}>
                  <Card>
                    <CardBody>
                      <Title headingLevel="h3" size="lg" style={{ marginBottom: '16px' }}>
                        Node Information
                      </Title>
                      <DescriptionList>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Name</DescriptionListTerm>
                          <DescriptionListDescription>
                            <strong>{node.name}</strong>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Status</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Label color="green">{node.status}</Label>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Role</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Label color="blue">{node.role}</Label>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Kubernetes Version</DescriptionListTerm>
                          <DescriptionListDescription>
                            <code>{node.version}</code>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Internal IP</DescriptionListTerm>
                          <DescriptionListDescription>
                            <code>{node.internalIP}</code>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>External IP</DescriptionListTerm>
                          <DescriptionListDescription>
                            <code>{node.externalIP}</code>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Hostname</DescriptionListTerm>
                          <DescriptionListDescription>{node.hostname}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>OS Image</DescriptionListTerm>
                          <DescriptionListDescription>
                            {node.osImage}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Kernel Version</DescriptionListTerm>
                          <DescriptionListDescription>
                            <code>{node.kernelVersion}</code>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Container Runtime</DescriptionListTerm>
                          <DescriptionListDescription>
                            <code>{node.containerRuntime}</code>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </CardBody>
                  </Card>
                </GridItem>

                <GridItem md={6}>
                  <Card>
                    <CardBody>
                      <Title headingLevel="h3" size="lg" style={{ marginBottom: '16px' }}>
                        Resource Utilization
                      </Title>
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong>CPU Usage</strong>
                          <span style={{ float: 'right' }}>{node.cpu.usage}%</span>
                        </div>
                        <Progress
                          value={node.cpu.usage}
                          title="CPU"
                          variant={
                            node.cpu.usage > 80
                              ? ProgressVariant.danger
                              : node.cpu.usage > 60
                              ? ProgressVariant.warning
                              : ProgressVariant.success
                          }
                        />
                        <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)', marginTop: '4px' }}>
                          Allocatable: {node.cpu.allocatable} / Capacity: {node.cpu.capacity}
                        </div>
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Memory Usage</strong>
                          <span style={{ float: 'right' }}>{node.memory.usage}%</span>
                        </div>
                        <Progress
                          value={node.memory.usage}
                          title="Memory"
                          variant={
                            node.memory.usage > 80
                              ? ProgressVariant.danger
                              : node.memory.usage > 60
                              ? ProgressVariant.warning
                              : ProgressVariant.success
                          }
                        />
                        <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)', marginTop: '4px' }}>
                          Allocatable: {node.memory.allocatable} / Capacity: {node.memory.capacity}
                        </div>
                      </div>

                      <div>
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Pod Usage</strong>
                          <span style={{ float: 'right' }}>
                            {node.pods.current} / {node.pods.capacity}
                          </span>
                        </div>
                        <Progress
                          value={(node.pods.current / node.pods.capacity) * 100}
                          title="Pods"
                          variant={ProgressVariant.success}
                        />
                      </div>
                    </CardBody>
                  </Card>

                  <Card style={{ marginTop: '24px' }}>
                    <CardBody>
                      <Title headingLevel="h3" size="lg" style={{ marginBottom: '16px' }}>
                        Conditions
                      </Title>
                      {node.conditions.map((condition) => (
                        <div key={condition.type} style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>{condition.type}</strong>
                            <Label color={condition.status === 'True' ? 'green' : condition.status === 'False' ? 'grey' : 'orange'}>
                              {condition.status}
                            </Label>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                            {condition.message}
                          </div>
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                </GridItem>
              </Grid>
            </div>
          </Tab>

          <Tab eventKey={1} title={<TabTitleText>Pods</TabTitleText>}>
            <div style={{ marginTop: '24px' }}>
              <Card>
                <CardBody>
                  <Table aria-label="Pods table" variant="compact">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Namespace</Th>
                        <Th>Status</Th>
                        <Th>CPU</Th>
                        <Th>Memory</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {node.pods.map((pod) => (
                        <Tr key={pod.name}>
                          <Td>
                            <strong>{pod.name}</strong>
                          </Td>
                          <Td>{pod.namespace}</Td>
                          <Td>
                            <Label color="green">{pod.status}</Label>
                          </Td>
                          <Td>{pod.cpu}</Td>
                          <Td>{pod.memory}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab eventKey={2} title={<TabTitleText>YAML</TabTitleText>}>
            <div style={{ marginTop: '24px' }}>
              <Card>
                <CardBody>
                  <CodeBlock>
                    <CodeBlockCode>{yamlContent}</CodeBlockCode>
                  </CodeBlock>
                </CardBody>
              </Card>
            </div>
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
}
