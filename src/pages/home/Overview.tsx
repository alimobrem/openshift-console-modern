import React, { useEffect } from 'react';
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
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  CubeIcon,
  ServerIcon,
} from '@patternfly/react-icons';
import { useClusterStore } from '@/store/useClusterStore';

export default function OverviewPF() {
  const { nodes, pods, fetchClusterData } = useClusterStore();

  useEffect(() => {
    fetchClusterData();
  }, [fetchClusterData]);

  const stats = {
    totalNodes: nodes.length,
    readyNodes: nodes.filter((n) => n.status === 'Ready').length,
    totalPods: pods.length,
    runningPods: pods.filter((p) => p.status === 'Running').length,
    failedPods: pods.filter((p) => p.status === 'Failed').length,
  };

  const clusterHealth = stats.failedPods === 0 ? 'Healthy' : 'Degraded';

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Cluster Overview
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Monitor your OpenShift cluster health and resources
        </p>
      </PageSection>

      <PageSection>
        <Gallery hasGutter minWidths={{ default: '100%', md: '250px' }}>
          {/* Total Nodes Card */}
          <GalleryItem className="compass-stat-card">
            <Card isFullHeight>
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <ServerIcon size="sm" />
                  </FlexItem>
                  <FlexItem>Total Nodes</FlexItem>
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

          {/* Running Pods Card */}
          <GalleryItem className="compass-stat-card">
            <Card isFullHeight>
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <CubeIcon size="sm" />
                  </FlexItem>
                  <FlexItem>Running Pods</FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h2" size="3xl">
                      {stats.runningPods}
                    </Title>
                  </StackItem>
                  <StackItem>
                    <span style={{ fontSize: '14px', color: 'var(--pf-v6-global--Color--200)' }}>
                      of {stats.totalPods} total
                    </span>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GalleryItem>

          {/* Failed Pods Card */}
          <GalleryItem className="compass-stat-card">
            <Card isFullHeight>
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <ExclamationCircleIcon size="sm" color="var(--pf-v6-global--danger-color--100)" />
                  </FlexItem>
                  <FlexItem>Failed Pods</FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h2" size="3xl" style={{ color: stats.failedPods > 0 ? 'var(--pf-v6-global--danger-color--100)' : 'inherit' }}>
                      {stats.failedPods}
                    </Title>
                  </StackItem>
                  <StackItem>
                    <span style={{ fontSize: '14px', color: 'var(--pf-v6-global--Color--200)' }}>
                      {stats.failedPods > 0 ? 'Requires attention' : 'No issues'}
                    </span>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GalleryItem>

          {/* Cluster Health Card */}
          <GalleryItem className="compass-stat-card">
            <Card isFullHeight>
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <CheckCircleIcon size="sm" color="var(--pf-v6-global--success-color--100)" />
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
                      style={{ color: clusterHealth === 'Healthy' ? 'var(--pf-v6-global--success-color--100)' : 'var(--pf-v6-global--warning-color--100)' }}
                    >
                      {clusterHealth}
                    </Title>
                  </StackItem>
                  <StackItem>
                    <span style={{ fontSize: '14px', color: 'var(--pf-v6-global--Color--200)' }}>
                      {clusterHealth === 'Healthy' ? 'All systems operational' : 'Some issues detected'}
                    </span>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GalleryItem>
        </Gallery>
      </PageSection>

      <PageSection>
        <Grid hasGutter>
          {/* Nodes Card */}
          <GridItem md={6}>
            <Card>
              <CardTitle>
                <Title headingLevel="h3">Nodes</Title>
              </CardTitle>
              <CardBody>
                <p style={{ marginBottom: '16px', color: 'var(--pf-v6-global--Color--200)' }}>
                  Cluster node status and utilization
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
                              <strong>{node.name}</strong>
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
                      </div>
                    </StackItem>
                  ))}
                </Stack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Recent Pods Card */}
          <GridItem md={6}>
            <Card>
              <CardTitle>
                <Title headingLevel="h3">Recent Pods</Title>
              </CardTitle>
              <CardBody>
                <p style={{ marginBottom: '16px', color: 'var(--pf-v6-global--Color--200)' }}>
                  Latest pod deployments and status
                </p>
                <Stack hasGutter>
                  {pods.slice(0, 5).map((pod) => (
                    <StackItem key={pod.name}>
                      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                        <FlexItem>
                          <Stack>
                            <StackItem>
                              <strong style={{ fontSize: '14px' }}>{pod.name}</strong>
                            </StackItem>
                            <StackItem>
                              <span style={{ fontSize: '12px', color: 'var(--pf-v6-global--Color--200)' }}>
                                {pod.namespace}
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
