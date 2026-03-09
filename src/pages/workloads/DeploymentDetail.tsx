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

export default function DeploymentDetail() {
  const { namespace, name } = useParams();
  const navigate = useNavigate();
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);

  const deployment = {
    name: name || 'frontend',
    namespace: namespace || 'default',
    replicas: { desired: 3, current: 3, ready: 3, available: 3 },
    strategy: 'RollingUpdate',
    maxSurge: '25%',
    maxUnavailable: '25%',
    selector: 'app=frontend',
    created: '2026-01-15T10:00:00Z',
    labels: {
      app: 'frontend',
      version: 'v1.0.0',
    },
    containers: [
      {
        name: 'frontend',
        image: 'nginx:1.21',
        ports: [80, 443],
      },
    ],
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

  return (
    <>
      <PageSection variant="default">
        <Breadcrumb>
          <BreadcrumbItem to="#" onClick={() => navigate('/workloads/deployments')}>
            Deployments
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{deployment.name}</BreadcrumbItem>
        </Breadcrumb>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div>
            <Title headingLevel="h1" size="2xl">
              {deployment.name}
            </Title>
            <div style={{ marginTop: '8px' }}>
              <Label color="green">Available</Label>
              <span style={{ marginLeft: '12px', color: 'var(--pf-v6-global--Color--200)' }}>
                Namespace: {deployment.namespace}
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
                        Deployment Details
                      </Title>
                      <DescriptionList>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Name</DescriptionListTerm>
                          <DescriptionListDescription>
                            <strong>{deployment.name}</strong>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Namespace</DescriptionListTerm>
                          <DescriptionListDescription>{deployment.namespace}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Strategy</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Label color="blue">{deployment.strategy}</Label>
                          </DescriptionListDescription>
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
                          <DescriptionListDescription>
                            <code>{deployment.selector}</code>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Created</DescriptionListTerm>
                          <DescriptionListDescription>{deployment.created}</DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </CardBody>
                  </Card>

                  <Card style={{ marginTop: '24px' }}>
                    <CardBody>
                      <Title headingLevel="h3" size="lg" style={{ marginBottom: '16px' }}>
                        Replica Status
                      </Title>
                      <Grid hasGutter>
                        <GridItem span={6}>
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                              Desired
                            </div>
                            <Title headingLevel="h2" size="xl">
                              {deployment.replicas.desired}
                            </Title>
                          </div>
                        </GridItem>
                        <GridItem span={6}>
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                              Ready
                            </div>
                            <Title headingLevel="h2" size="xl">
                              {deployment.replicas.ready}
                            </Title>
                          </div>
                        </GridItem>
                        <GridItem span={12}>
                          <Progress
                            value={(deployment.replicas.ready / deployment.replicas.desired) * 100}
                            title="Replica availability"
                            variant={ProgressVariant.success}
                          />
                        </GridItem>
                      </Grid>
                    </CardBody>
                  </Card>
                </GridItem>

                <GridItem md={6}>
                  <Card>
                    <CardBody>
                      <Title headingLevel="h3" size="lg" style={{ marginBottom: '16px' }}>
                        Conditions
                      </Title>
                      {deployment.conditions.map((condition) => (
                        <div key={condition.type} style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong>{condition.type}</strong>
                            <Label color={condition.status === 'True' ? 'green' : 'grey'}>
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

                  <Card style={{ marginTop: '24px' }}>
                    <CardBody>
                      <Title headingLevel="h3" size="lg" style={{ marginBottom: '16px' }}>
                        ReplicaSets
                      </Title>
                      <Table aria-label="ReplicaSets table" variant="compact">
                        <Thead>
                          <Tr>
                            <Th>Name</Th>
                            <Th>Replicas</Th>
                            <Th>Age</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {deployment.replicaSets.map((rs) => (
                            <Tr key={rs.name}>
                              <Td>{rs.name}</Td>
                              <Td>
                                <Label color={rs.replicas === '3/3' ? 'green' : 'grey'}>
                                  {rs.replicas}
                                </Label>
                              </Td>
                              <Td>{rs.age}</Td>
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

          <Tab eventKey={1} title={<TabTitleText>Pods</TabTitleText>}>
            <div style={{ marginTop: '24px' }}>
              <Card>
                <CardBody>
                  <Table aria-label="Pods table" variant="compact">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Status</Th>
                        <Th>Restarts</Th>
                        <Th>Age</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {deployment.pods.map((pod) => (
                        <Tr key={pod.name}>
                          <Td>
                            <strong>{pod.name}</strong>
                          </Td>
                          <Td>
                            <Label color="green">{pod.status}</Label>
                          </Td>
                          <Td>{pod.restarts}</Td>
                          <Td>{pod.age}</Td>
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
