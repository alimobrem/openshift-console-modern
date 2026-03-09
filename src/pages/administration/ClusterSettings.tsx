import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Grid,
  GridItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
} from '@patternfly/react-core';

export default function ClusterSettings() {
  const clusterInfo = {
    name: 'production-cluster',
    id: 'abc123def456',
    version: '4.14.8',
    platform: 'AWS',
    region: 'us-east-1',
    apiServer: 'https://api.cluster.example.com:6443',
    consoleURL: 'https://console-openshift-console.apps.cluster.example.com',
    created: '2023-09-15',
    updated: '2026-02-20',
  };

  const networkConfig = {
    clusterNetwork: '10.128.0.0/14',
    serviceNetwork: '172.30.0.0/16',
    networkType: 'OVNKubernetes',
    dnsOperator: 'Running',
  };

  const authConfig = {
    provider: 'htpasswd',
    identityProviders: 2,
    sessionTimeout: '24h',
  };

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Cluster Settings
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          View and configure global cluster settings
        </p>
      </PageSection>

      <PageSection>
        <Grid hasGutter>
          <GridItem md={6}>
            <Card>
              <CardTitle>
                <Title headingLevel="h3">Cluster Information</Title>
              </CardTitle>
              <CardBody>
                <DescriptionList>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Cluster Name</DescriptionListTerm>
                    <DescriptionListDescription>
                      <strong>{clusterInfo.name}</strong>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Cluster ID</DescriptionListTerm>
                    <DescriptionListDescription>
                      <code style={{ fontSize: '0.875rem' }}>{clusterInfo.id}</code>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Version</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Label color="blue">{clusterInfo.version}</Label>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Platform</DescriptionListTerm>
                    <DescriptionListDescription>
                      {clusterInfo.platform} ({clusterInfo.region})
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>API Server</DescriptionListTerm>
                    <DescriptionListDescription>
                      <code style={{ fontSize: '0.875rem' }}>{clusterInfo.apiServer}</code>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Console URL</DescriptionListTerm>
                    <DescriptionListDescription>
                      <code style={{ fontSize: '0.875rem' }}>{clusterInfo.consoleURL}</code>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Created</DescriptionListTerm>
                    <DescriptionListDescription>
                      {clusterInfo.created}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Last Updated</DescriptionListTerm>
                    <DescriptionListDescription>
                      {clusterInfo.updated}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem md={6}>
            <Card>
              <CardTitle>
                <Title headingLevel="h3">Network Configuration</Title>
              </CardTitle>
              <CardBody>
                <DescriptionList>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Cluster Network</DescriptionListTerm>
                    <DescriptionListDescription>
                      <code style={{ fontSize: '0.875rem' }}>{networkConfig.clusterNetwork}</code>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Service Network</DescriptionListTerm>
                    <DescriptionListDescription>
                      <code style={{ fontSize: '0.875rem' }}>{networkConfig.serviceNetwork}</code>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Network Type</DescriptionListTerm>
                    <DescriptionListDescription>
                      {networkConfig.networkType}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>DNS Operator</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Label color="green">{networkConfig.dnsOperator}</Label>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>

            <Card style={{ marginTop: '24px' }}>
              <CardTitle>
                <Title headingLevel="h3">Authentication</Title>
              </CardTitle>
              <CardBody>
                <DescriptionList>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Provider</DescriptionListTerm>
                    <DescriptionListDescription>
                      {authConfig.provider}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Identity Providers</DescriptionListTerm>
                    <DescriptionListDescription>
                      {authConfig.identityProviders}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Session Timeout</DescriptionListTerm>
                    <DescriptionListDescription>
                      {authConfig.sessionTimeout}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
}
