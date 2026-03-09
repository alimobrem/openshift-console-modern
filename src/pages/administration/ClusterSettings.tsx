import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Grid,
  GridItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
  Button,
  Progress,
  ProgressVariant,
} from '@patternfly/react-core';
import { CheckCircleIcon, InProgressIcon } from '@patternfly/react-icons';
import { useUIStore } from '@/store/useUIStore';
import '@/openshift-components.css';

export default function ClusterSettings() {
  const addToast = useUIStore((s) => s.addToast);
  const [upgrading, setUpgrading] = React.useState(false);
  const [upgradeProgress, setUpgradeProgress] = React.useState(0);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startUpgrade = () => {
    setUpgrading(true);
    setUpgradeProgress(0);
    addToast({ type: 'info', title: 'Cluster upgrade started', description: 'Upgrading to OpenShift 4.15.1...' });
    intervalRef.current = setInterval(() => {
      setUpgradeProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setUpgrading(false);
          addToast({ type: 'success', title: 'Cluster upgrade complete', description: 'Now running OpenShift 4.15.1' });
          return 100;
        }
        return prev + 5;
      });
    }, 500);
  };

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">Cluster Settings</Title>
        <p className="os-cluster-settings__description">
          View and configure global cluster settings
        </p>
      </PageSection>

      <PageSection>
        {/* Upgrade Card */}
        <Card className="os-cluster-settings__card--spaced">
          <CardBody>
            <div className="os-cluster-settings__upgrade-header">
              <div>
                <Title headingLevel="h3" size="lg">Cluster Update</Title>
                <p className="os-cluster-settings__upgrade-version">
                  Current version: <Label color="blue">4.14.8</Label>
                </p>
              </div>
              {!upgrading && upgradeProgress < 100 && (
                <Button variant="primary" onClick={startUpgrade}>
                  Update to 4.15.1
                </Button>
              )}
              {upgradeProgress >= 100 && (
                <Label color="green" icon={<CheckCircleIcon />}>Up to date</Label>
              )}
            </div>
            {upgrading && (
              <div>
                <div className="os-cluster-settings__upgrade-progress-row">
                  <InProgressIcon className="os-cluster-settings__upgrade-spinner" />
                  <span className="os-cluster-settings__upgrade-label">Upgrading cluster... {upgradeProgress}%</span>
                </div>
                <Progress value={upgradeProgress} variant={ProgressVariant.success} />
                <div className="os-cluster-settings__upgrade-detail">
                  Updating control plane components, operators, and worker nodes...
                </div>
              </div>
            )}
            {!upgrading && upgradeProgress < 100 && (
              <div className="os-cluster-settings__update-info">
                <div className="os-cluster-settings__update-available">
                  <strong>Available update:</strong> OpenShift 4.15.1
                </div>
                <div className="os-cluster-settings__update-channel">
                  Channel: stable-4.14 &bull; Architecture: amd64 &bull; Risk: Low
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Grid hasGutter>
          <GridItem md={6}>
            <Card>
              <CardBody>
                <Title headingLevel="h3" size="lg" className="os-detail__section-title">Cluster Information</Title>
                <DescriptionList isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Cluster Name</DescriptionListTerm>
                    <DescriptionListDescription>production-cluster</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Cluster ID</DescriptionListTerm>
                    <DescriptionListDescription className="os-cluster-settings__cluster-id">abc123def456</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Version</DescriptionListTerm>
                    <DescriptionListDescription><Label color="blue">{upgradeProgress >= 100 ? '4.15.1' : '4.14.8'}</Label></DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Platform</DescriptionListTerm>
                    <DescriptionListDescription>AWS (us-east-1)</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>API Server</DescriptionListTerm>
                    <DescriptionListDescription><code>https://api.cluster.example.com:6443</code></DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Console URL</DescriptionListTerm>
                    <DescriptionListDescription><code>https://console-openshift-console.apps.cluster.example.com</code></DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Created</DescriptionListTerm>
                    <DescriptionListDescription>2023-09-15</DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem md={6}>
            <Card className="os-cluster-settings__card--spaced">
              <CardBody>
                <Title headingLevel="h3" size="lg" className="os-detail__section-title">Network Configuration</Title>
                <DescriptionList isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Cluster Network</DescriptionListTerm>
                    <DescriptionListDescription><code>10.128.0.0/14</code></DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Service Network</DescriptionListTerm>
                    <DescriptionListDescription><code>172.30.0.0/16</code></DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Network Type</DescriptionListTerm>
                    <DescriptionListDescription>OVNKubernetes</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>DNS Operator</DescriptionListTerm>
                    <DescriptionListDescription><Label color="green">Running</Label></DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Title headingLevel="h3" size="lg" className="os-detail__section-title">Authentication</Title>
                <DescriptionList isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Provider</DescriptionListTerm>
                    <DescriptionListDescription>htpasswd</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Identity Providers</DescriptionListTerm>
                    <DescriptionListDescription>2</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Session Timeout</DescriptionListTerm>
                    <DescriptionListDescription>24h</DescriptionListDescription>
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
