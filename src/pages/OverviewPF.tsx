import { useEffect } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Gallery,
  GalleryItem,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Flex,
  FlexItem,
  Label,
  Progress,
  ProgressVariant,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  ServerIcon,
  DatabaseIcon,
  NetworkIcon,
  HddIcon,
  ProjectDiagramIcon,
  InProgressIcon,
  BellIcon,
} from '@patternfly/react-icons';
import { useClusterStore } from '@/store/useClusterStore';

export default function OverviewPF() {
  const {
    nodes,
    pods,
    deployments,
    services,
    persistentVolumes,
    namespaces,
    events,
    clusterInfo,
    storageInfo,
    fetchClusterData,
  } = useClusterStore();

  useEffect(() => {
    fetchClusterData();
  }, [fetchClusterData]);

  const stats = {
    totalNodes: nodes.length,
    readyNodes: nodes.filter((n) => n.status === 'Ready').length,
    totalPods: pods.length,
    runningPods: pods.filter((p) => p.status === 'Running').length,
    failedPods: pods.filter((p) => p.status === 'Failed').length,
    pendingPods: pods.filter((p) => p.status === 'Pending').length,
    totalDeployments: deployments.length,
    availableDeployments: deployments.filter((d) => d.status === 'Available').length,
    totalServices: services.length,
    totalPVs: persistentVolumes.length,
    boundPVs: persistentVolumes.filter((pv) => pv.status === 'Bound').length,
    totalNamespaces: namespaces.length,
    warningEvents: events.filter((e) => e.type === 'Warning').length,
    errorEvents: events.filter((e) => e.type === 'Error').length,
  };

  const clusterHealth = stats.failedPods === 0 && stats.errorEvents === 0 ? 'Healthy' :
                        stats.errorEvents > 0 ? 'Degraded' : 'Warning';

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Cluster Overview
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Monitor your OpenShift cluster health, resources, and performance metrics
        </p>
      </PageSection>

      {/* Cluster Information */}
      {clusterInfo && (
        <PageSection>
          <Card>
            <CardTitle>
              <Flex alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>
                  <ServerIcon />
                </FlexItem>
                <FlexItem>
                  <Title headingLevel="h3">Cluster Details</Title>
                </FlexItem>
              </Flex>
            </CardTitle>
            <CardBody>
              <DescriptionList isHorizontal columnModifier={{ default: '2Col' }}>
                <DescriptionListGroup>
                  <DescriptionListTerm>OpenShift Version</DescriptionListTerm>
                  <DescriptionListDescription>{clusterInfo.version}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Kubernetes Version</DescriptionListTerm>
                  <DescriptionListDescription>{clusterInfo.kubernetesVersion}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Platform</DescriptionListTerm>
                  <DescriptionListDescription>{clusterInfo.platform}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Region</DescriptionListTerm>
                  <DescriptionListDescription>{clusterInfo.region}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Update Channel</DescriptionListTerm>
                  <DescriptionListDescription>{clusterInfo.updateChannel}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>API Server</DescriptionListTerm>
                  <DescriptionListDescription style={{ fontSize: '12px' }}>{clusterInfo.apiURL}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </CardBody>
          </Card>
        </PageSection>
      )}

      {/* Main Status Cards */}
      <PageSection>
        <Gallery hasGutter minWidths={{ default: '100%', sm: '250px' }}>
          {/* Cluster Health Card */}
          <GalleryItem className="compass-stat-card">
            <Card isFullHeight>
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    {clusterHealth === 'Healthy' ? (
                      <CheckCircleIcon color="var(--pf-v6-global--success-color--100)" />
                    ) : clusterHealth === 'Degraded' ? (
                      <ExclamationCircleIcon color="var(--pf-v6-global--danger-color--100)" />
                    ) : (
                      <ExclamationTriangleIcon color="var(--pf-v6-global--warning-color--100)" />
                    )}
                  </FlexItem>
                  <FlexItem>Cluster Health</FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title
                      headingLevel="h2"
                      size="3xl"
                      style={{
                        color: clusterHealth === 'Healthy'
                          ? 'var(--pf-v6-global--success-color--100)'
                          : clusterHealth === 'Degraded'
                          ? 'var(--pf-v6-global--danger-color--100)'
                          : 'var(--pf-v6-global--warning-color--100)'
                      }}
                    >
                      {clusterHealth}
                    </Title>
                  </StackItem>
                  <StackItem>
                    <span style={{ fontSize: '14px', color: 'var(--pf-v6-global--Color--200)' }}>
                      {stats.errorEvents} errors, {stats.warningEvents} warnings
                    </span>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GalleryItem>

          {/* Total Nodes Card */}
          <GalleryItem className="compass-stat-card">
            <Card isFullHeight>
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <ServerIcon />
                  </FlexItem>
                  <FlexItem>Nodes</FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h2" size="3xl">
                      {stats.totalNodes}
                    </Title>
                  </StackItem>
                  <StackItem>
                    <span style={{ fontSize: '14px', color: 'var(--pf-v6-global--Color--200)' }}>
                      {stats.readyNodes} ready
                    </span>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GalleryItem>

          {/* Pods Card */}
          <GalleryItem className="compass-stat-card">
            <Card isFullHeight>
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <CubeIcon />
                  </FlexItem>
                  <FlexItem>Pods</FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h2" size="3xl">
                      {stats.totalPods}
                    </Title>
                  </StackItem>
                  <StackItem>
                    <span style={{ fontSize: '14px', color: 'var(--pf-v6-global--Color--200)' }}>
                      {stats.runningPods} running, {stats.failedPods} failed
                    </span>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GalleryItem>

          {/* Deployments Card */}
          <GalleryItem className="compass-stat-card">
            <Card isFullHeight>
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <InProgressIcon />
                  </FlexItem>
                  <FlexItem>Deployments</FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h2" size="3xl">
                      {stats.totalDeployments}
                    </Title>
                  </StackItem>
                  <StackItem>
                    <span style={{ fontSize: '14px', color: 'var(--pf-v6-global--Color--200)' }}>
                      {stats.availableDeployments} available
                    </span>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GalleryItem>

          {/* Services Card */}
          <GalleryItem className="compass-stat-card">
            <Card isFullHeight>
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <NetworkIcon />
                  </FlexItem>
                  <FlexItem>Services</FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h2" size="3xl">
                      {stats.totalServices}
                    </Title>
                  </StackItem>
                  <StackItem>
                    <span style={{ fontSize: '14px', color: 'var(--pf-v6-global--Color--200)' }}>
                      Active services
                    </span>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GalleryItem>

          {/* Persistent Volumes Card */}
          <GalleryItem className="compass-stat-card">
            <Card isFullHeight>
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <DatabaseIcon />
                  </FlexItem>
                  <FlexItem>Volumes</FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h2" size="3xl">
                      {stats.totalPVs}
                    </Title>
                  </StackItem>
                  <StackItem>
                    <span style={{ fontSize: '14px', color: 'var(--pf-v6-global--Color--200)' }}>
                      {stats.boundPVs} bound
                    </span>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GalleryItem>

          {/* Namespaces Card */}
          <GalleryItem className="compass-stat-card">
            <Card isFullHeight>
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <ProjectDiagramIcon />
                  </FlexItem>
                  <FlexItem>Namespaces</FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h2" size="3xl">
                      {stats.totalNamespaces}
                    </Title>
                  </StackItem>
                  <StackItem>
                    <span style={{ fontSize: '14px', color: 'var(--pf-v6-global--Color--200)' }}>
                      Active namespaces
                    </span>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GalleryItem>

          {/* Storage Card */}
          {storageInfo && (
            <GalleryItem className="compass-stat-card">
              <Card isFullHeight>
                <CardTitle>
                  <Flex alignItems={{ default: 'alignItemsCenter' }}>
                    <FlexItem>
                      <HddIcon />
                    </FlexItem>
                    <FlexItem>Storage</FlexItem>
                  </Flex>
                </CardTitle>
                <CardBody>
                  <Stack hasGutter>
                    <StackItem>
                      <Title headingLevel="h2" size="3xl">
                        {storageInfo.used}
                      </Title>
                    </StackItem>
                    <StackItem>
                      <span style={{ fontSize: '14px', color: 'var(--pf-v6-global--Color--200)' }}>
                        of {storageInfo.totalCapacity} used
                      </span>
                    </StackItem>
                  </Stack>
                </CardBody>
              </Card>
            </GalleryItem>
          )}
        </Gallery>
      </PageSection>

      {/* Events & Alerts Section */}
      <PageSection>
        <Card>
          <CardTitle>
            <Flex alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <BellIcon />
              </FlexItem>
              <FlexItem>
                <Title headingLevel="h3">Recent Events</Title>
              </FlexItem>
            </Flex>
          </CardTitle>
          <CardBody>
            <p style={{ marginBottom: '16px', color: 'var(--pf-v6-global--Color--200)' }}>
              Latest cluster events and alerts
            </p>
            <Stack hasGutter>
              {events.slice(0, 8).map((event, index) => (
                <StackItem key={index}>
                  <Flex
                    justifyContent={{ default: 'justifyContentSpaceBetween' }}
                    alignItems={{ default: 'alignItemsCenter' }}
                  >
                    <FlexItem>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          {event.type === 'Warning' ? (
                            <ExclamationTriangleIcon color="var(--pf-v6-global--warning-color--100)" />
                          ) : event.type === 'Error' ? (
                            <ExclamationCircleIcon color="var(--pf-v6-global--danger-color--100)" />
                          ) : (
                            <CheckCircleIcon color="var(--pf-v6-global--success-color--100)" />
                          )}
                        </FlexItem>
                        <FlexItem>
                          <Stack>
                            <StackItem>
                              <strong style={{ fontSize: '14px' }}>{event.reason}</strong>
                            </StackItem>
                            <StackItem>
                              <span style={{ fontSize: '12px', color: 'var(--pf-v6-global--Color--200)' }}>
                                {event.message}
                              </span>
                            </StackItem>
                          </Stack>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                    <FlexItem>
                      <Flex spaceItems={{ default: 'spaceItemsMd' }}>
                        <FlexItem>
                          <Label>{event.namespace}</Label>
                        </FlexItem>
                        <FlexItem>
                          <span style={{ fontSize: '12px', color: 'var(--pf-v6-global--Color--200)' }}>
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </StackItem>
              ))}
            </Stack>
          </CardBody>
        </Card>
      </PageSection>

      {/* Detailed Resource Views */}
      <PageSection>
        <Grid hasGutter>
          {/* Nodes Card */}
          <GridItem md={6}>
            <Card isFullHeight>
              <CardTitle>
                <Title headingLevel="h3">Nodes</Title>
              </CardTitle>
              <CardBody>
                <p style={{ marginBottom: '16px', color: 'var(--pf-v6-global--Color--200)' }}>
                  Cluster node status and resource utilization
                </p>
                <Stack hasGutter>
                  {nodes.map((node) => (
                    <StackItem key={node.name}>
                      <Flex
                        justifyContent={{ default: 'justifyContentSpaceBetween' }}
                        alignItems={{ default: 'alignItemsCenter' }}
                      >
                        <FlexItem>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                            <FlexItem>
                              {node.status === 'Ready' ? (
                                <CheckCircleIcon color="var(--pf-v6-global--success-color--100)" />
                              ) : (
                                <ExclamationCircleIcon color="var(--pf-v6-global--danger-color--100)" />
                              )}
                            </FlexItem>
                            <FlexItem>
                              <Stack>
                                <StackItem>
                                  <strong>{node.name}</strong>
                                </StackItem>
                                <StackItem>
                                  <span style={{ fontSize: '12px', color: 'var(--pf-v6-global--Color--200)' }}>
                                    {node.role} • {node.version}
                                  </span>
                                </StackItem>
                              </Stack>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                        <FlexItem>
                          <Flex spaceItems={{ default: 'spaceItemsMd' }}>
                            <FlexItem>
                              <span style={{ fontSize: '14px' }}>CPU: {node.cpu}%</span>
                            </FlexItem>
                            <FlexItem>
                              <span style={{ fontSize: '14px' }}>Memory: {node.memory}%</span>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                      </Flex>
                      <div style={{ marginTop: '8px' }}>
                        <Progress
                          value={node.cpu}
                          title="CPU"
                          variant={node.cpu > 80 ? ProgressVariant.danger : node.cpu > 60 ? ProgressVariant.warning : ProgressVariant.success}
                        />
                        <div style={{ marginTop: '4px' }}>
                          <Progress
                            value={node.memory}
                            title="Memory"
                            variant={node.memory > 80 ? ProgressVariant.danger : node.memory > 60 ? ProgressVariant.warning : ProgressVariant.success}
                          />
                        </div>
                      </div>
                    </StackItem>
                  ))}
                </Stack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Deployments Card */}
          <GridItem md={6}>
            <Card isFullHeight>
              <CardTitle>
                <Title headingLevel="h3">Deployments</Title>
              </CardTitle>
              <CardBody>
                <p style={{ marginBottom: '16px', color: 'var(--pf-v6-global--Color--200)' }}>
                  Application deployment status
                </p>
                <Stack hasGutter>
                  {deployments.map((deployment) => (
                    <StackItem key={`${deployment.namespace}/${deployment.name}`}>
                      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                        <FlexItem>
                          <Stack>
                            <StackItem>
                              <strong style={{ fontSize: '14px' }}>{deployment.name}</strong>
                            </StackItem>
                            <StackItem>
                              <span style={{ fontSize: '12px', color: 'var(--pf-v6-global--Color--200)' }}>
                                {deployment.namespace}
                              </span>
                            </StackItem>
                          </Stack>
                        </FlexItem>
                        <FlexItem>
                          <Flex spaceItems={{ default: 'spaceItemsMd' }} alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem>
                              <span style={{ fontSize: '14px' }}>
                                {deployment.ready}/{deployment.replicas}
                              </span>
                            </FlexItem>
                            <FlexItem>
                              <Label
                                color={
                                  deployment.status === 'Available'
                                    ? 'green'
                                    : deployment.status === 'Progressing'
                                    ? 'blue'
                                    : 'red'
                                }
                              >
                                {deployment.status}
                              </Label>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                      </Flex>
                    </StackItem>
                  ))}
                </Stack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Namespaces Card */}
          <GridItem md={6}>
            <Card isFullHeight>
              <CardTitle>
                <Title headingLevel="h3">Namespaces</Title>
              </CardTitle>
              <CardBody>
                <p style={{ marginBottom: '16px', color: 'var(--pf-v6-global--Color--200)' }}>
                  Project namespaces and pod distribution
                </p>
                <Stack hasGutter>
                  {namespaces.map((namespace) => (
                    <StackItem key={namespace.name}>
                      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                        <FlexItem>
                          <Stack>
                            <StackItem>
                              <strong style={{ fontSize: '14px' }}>{namespace.name}</strong>
                            </StackItem>
                            <StackItem>
                              <span style={{ fontSize: '12px', color: 'var(--pf-v6-global--Color--200)' }}>
                                {namespace.podCount} pods • {namespace.age}
                              </span>
                            </StackItem>
                          </Stack>
                        </FlexItem>
                        <FlexItem>
                          <Label color={namespace.status === 'Active' ? 'green' : 'orange'}>
                            {namespace.status}
                          </Label>
                        </FlexItem>
                      </Flex>
                    </StackItem>
                  ))}
                </Stack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Recent Pods Card */}
          <GridItem md={6}>
            <Card isFullHeight>
              <CardTitle>
                <Title headingLevel="h3">Recent Pods</Title>
              </CardTitle>
              <CardBody>
                <p style={{ marginBottom: '16px', color: 'var(--pf-v6-global--Color--200)' }}>
                  Latest pod deployments and status
                </p>
                <Stack hasGutter>
                  {pods.slice(0, 7).map((pod) => (
                    <StackItem key={pod.name}>
                      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                        <FlexItem>
                          <Stack>
                            <StackItem>
                              <strong style={{ fontSize: '14px' }}>{pod.name}</strong>
                            </StackItem>
                            <StackItem>
                              <span style={{ fontSize: '12px', color: 'var(--pf-v6-global--Color--200)' }}>
                                {pod.namespace} • {pod.restarts} restarts
                              </span>
                            </StackItem>
                          </Stack>
                        </FlexItem>
                        <FlexItem>
                          <Label
                            color={
                              pod.status === 'Running'
                                ? 'green'
                                : pod.status === 'Pending'
                                ? 'orange'
                                : 'red'
                            }
                          >
                            {pod.status}
                          </Label>
                        </FlexItem>
                      </Flex>
                    </StackItem>
                  ))}
                </Stack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
}
