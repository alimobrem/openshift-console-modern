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
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { TrashIcon, EditIcon } from '@patternfly/react-icons';

export default function PodDetail() {
  const { namespace, name } = useParams();
  const navigate = useNavigate();
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);

  // Mock pod data
  const pod = {
    name: name || 'frontend-7d8f9b5c4d-x7k2m',
    namespace: namespace || 'default',
    status: 'Running',
    podIP: '10.128.2.45',
    nodeIP: '192.168.1.10',
    nodeName: 'worker-0',
    created: '2026-02-28T10:15:30Z',
    labels: {
      app: 'frontend',
      'pod-template-hash': '7d8f9b5c4d',
      version: 'v1.0.0',
    },
    annotations: {
      'kubernetes.io/created-by': 'deployment-controller',
    },
    containers: [
      {
        name: 'frontend',
        image: 'nginx:1.21',
        ready: true,
        restartCount: 0,
        state: 'Running',
        cpu: '10m',
        memory: '128Mi',
      },
    ],
    conditions: [
      { type: 'Initialized', status: 'True', lastTransition: '2026-02-28T10:15:30Z' },
      { type: 'Ready', status: 'True', lastTransition: '2026-02-28T10:15:35Z' },
      { type: 'ContainersReady', status: 'True', lastTransition: '2026-02-28T10:15:35Z' },
      { type: 'PodScheduled', status: 'True', lastTransition: '2026-02-28T10:15:30Z' },
    ],
    events: [
      {
        type: 'Normal',
        reason: 'Scheduled',
        message: 'Successfully assigned default/frontend-7d8f9b5c4d-x7k2m to worker-0',
        time: '2m',
      },
      {
        type: 'Normal',
        reason: 'Pulled',
        message: 'Container image "nginx:1.21" already present on machine',
        time: '2m',
      },
      {
        type: 'Normal',
        reason: 'Created',
        message: 'Created container frontend',
        time: '2m',
      },
      {
        type: 'Normal',
        reason: 'Started',
        message: 'Started container frontend',
        time: '2m',
      },
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running':
        return 'green';
      case 'Pending':
        return 'orange';
      case 'Failed':
      case 'Error':
        return 'red';
      default:
        return 'grey';
    }
  };

  return (
    <>
      <PageSection variant="default">
        <Breadcrumb>
          <BreadcrumbItem to="#" onClick={() => navigate('/workloads/pods')}>
            Pods
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{pod.name}</BreadcrumbItem>
        </Breadcrumb>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div>
            <Title headingLevel="h1" size="2xl">
              {pod.name}
            </Title>
            <div style={{ marginTop: '8px' }}>
              <Label color={getStatusColor(pod.status)}>{pod.status}</Label>
              <span style={{ marginLeft: '12px', color: 'var(--pf-v6-global--Color--200)' }}>
                Namespace: {pod.namespace}
              </span>
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
                        Pod Details
                      </Title>
                      <DescriptionList>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Name</DescriptionListTerm>
                          <DescriptionListDescription>
                            <strong>{pod.name}</strong>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Namespace</DescriptionListTerm>
                          <DescriptionListDescription>{pod.namespace}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Status</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Label color={getStatusColor(pod.status)}>{pod.status}</Label>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Pod IP</DescriptionListTerm>
                          <DescriptionListDescription>
                            <code>{pod.podIP}</code>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Node</DescriptionListTerm>
                          <DescriptionListDescription>{pod.nodeName}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Node IP</DescriptionListTerm>
                          <DescriptionListDescription>
                            <code>{pod.nodeIP}</code>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Created</DescriptionListTerm>
                          <DescriptionListDescription>{pod.created}</DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </CardBody>
                  </Card>

                  <Card style={{ marginTop: '24px' }}>
                    <CardBody>
                      <Title headingLevel="h3" size="lg" style={{ marginBottom: '16px' }}>
                        Labels
                      </Title>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {Object.entries(pod.labels).map(([key, value]) => (
                          <Label key={key} color="blue">
                            <code style={{ fontSize: '0.75rem' }}>
                              {key}={value}
                            </code>
                          </Label>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </GridItem>

                <GridItem md={6}>
                  <Card>
                    <CardBody>
                      <Title headingLevel="h3" size="lg" style={{ marginBottom: '16px' }}>
                        Containers
                      </Title>
                      {pod.containers.map((container) => (
                        <div key={container.name} style={{ marginBottom: '16px' }}>
                          <DescriptionList>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Name</DescriptionListTerm>
                              <DescriptionListDescription>
                                <strong>{container.name}</strong>
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Image</DescriptionListTerm>
                              <DescriptionListDescription>
                                <code>{container.image}</code>
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>State</DescriptionListTerm>
                              <DescriptionListDescription>
                                <Label color="green">{container.state}</Label>
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Restart Count</DescriptionListTerm>
                              <DescriptionListDescription>
                                {container.restartCount}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Resources</DescriptionListTerm>
                              <DescriptionListDescription>
                                CPU: {container.cpu}, Memory: {container.memory}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                          </DescriptionList>
                        </div>
                      ))}
                    </CardBody>
                  </Card>

                  <Card style={{ marginTop: '24px' }}>
                    <CardBody>
                      <Title headingLevel="h3" size="lg" style={{ marginBottom: '16px' }}>
                        Conditions
                      </Title>
                      <Table aria-label="Conditions table" variant="compact">
                        <Thead>
                          <Tr>
                            <Th>Type</Th>
                            <Th>Status</Th>
                            <Th>Last Transition</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {pod.conditions.map((condition) => (
                            <Tr key={condition.type}>
                              <Td>{condition.type}</Td>
                              <Td>
                                <Label color={condition.status === 'True' ? 'green' : 'grey'}>
                                  {condition.status}
                                </Label>
                              </Td>
                              <Td>{condition.lastTransition}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                </GridItem>
              </Grid>
            </div>
          </Tab>

          <Tab eventKey={1} title={<TabTitleText>Events</TabTitleText>}>
            <div style={{ marginTop: '24px' }}>
              <Card>
                <CardBody>
                  <Table aria-label="Events table" variant="compact">
                    <Thead>
                      <Tr>
                        <Th>Type</Th>
                        <Th>Reason</Th>
                        <Th>Message</Th>
                        <Th>Time</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pod.events.map((event, idx) => (
                        <Tr key={idx}>
                          <Td>
                            <Label color={event.type === 'Normal' ? 'green' : 'orange'}>
                              {event.type}
                            </Label>
                          </Td>
                          <Td>
                            <strong>{event.reason}</strong>
                          </Td>
                          <Td>{event.message}</Td>
                          <Td>{event.time}</Td>
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

          <Tab eventKey={3} title={<TabTitleText>Logs</TabTitleText>}>
            <div style={{ marginTop: '24px' }}>
              <Card>
                <CardBody>
                  <CodeBlock>
                    <CodeBlockCode>
                      {`2026-03-03 10:15:35 [INFO] Starting nginx...
2026-03-03 10:15:36 [INFO] Nginx started successfully
2026-03-03 10:15:40 [INFO] 10.128.2.1 - "GET / HTTP/1.1" 200 612
2026-03-03 10:15:45 [INFO] 10.128.2.1 - "GET /health HTTP/1.1" 200 2
2026-03-03 10:16:00 [INFO] 10.128.2.1 - "GET / HTTP/1.1" 200 612`}
                    </CodeBlockCode>
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
