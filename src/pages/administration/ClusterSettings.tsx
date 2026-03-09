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
import { useK8sResource, type K8sMeta } from '@/hooks/useK8sResource';
import '@/openshift-components.css';

interface RawClusterVersion extends K8sMeta {
  status?: {
    desired?: { version: string };
    history?: { version: string; state: string }[];
    conditions?: { type: string; status: string; message?: string }[];
    availableUpdates?: { version: string }[];
  };
  spec?: { channel?: string; clusterID?: string };
}

interface RawInfrastructure extends K8sMeta {
  status?: {
    platform?: string;
    platformStatus?: { type?: string; aws?: { region?: string } };
    apiServerURL?: string;
    controlPlaneTopology?: string;
  };
}

export default function ClusterSettings() {
  const addToast = useUIStore((s) => s.addToast);
  const [upgrading, setUpgrading] = React.useState(false);
  const [upgradeProgress, setUpgradeProgress] = React.useState(0);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: clusterVersions } = useK8sResource<RawClusterVersion, RawClusterVersion>(
    '/apis/config.openshift.io/v1/clusterversions',
    (item) => item,
  );

  const { data: infras } = useK8sResource<RawInfrastructure, RawInfrastructure>(
    '/apis/config.openshift.io/v1/infrastructures',
    (item) => item,
  );

  const cv = clusterVersions[0];
  const infra = infras[0];
  const currentVersion = cv?.status?.history?.[0]?.version ?? cv?.status?.desired?.version ?? '-';
  const channel = cv?.spec?.channel ?? '-';
  const clusterID = cv?.spec?.clusterID ?? '-';
  const platform = infra?.status?.platformStatus?.type ?? infra?.status?.platform ?? '-';
  const region = infra?.status?.platformStatus?.aws?.region ?? '-';
  const apiServer = infra?.status?.apiServerURL ?? '-';
  const availableUpdate = cv?.status?.availableUpdates?.[0]?.version;

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startUpgrade = () => {
    if (!availableUpdate) return;
    setUpgrading(true);
    setUpgradeProgress(0);
    addToast({ type: 'info', title: 'Cluster upgrade started', description: `Upgrading to ${availableUpdate}...` });
    intervalRef.current = setInterval(() => {
      setUpgradeProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setUpgrading(false);
          addToast({ type: 'success', title: 'Cluster upgrade complete', description: `Now running ${availableUpdate}` });
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
        <Card className="os-cluster-settings__card--spaced">
          <CardBody>
            <div className="os-cluster-settings__upgrade-header">
              <div>
                <Title headingLevel="h3" size="lg">Cluster Update</Title>
                <p className="os-cluster-settings__upgrade-version">
                  Current version: <Label color="blue">{currentVersion}</Label>
                </p>
              </div>
              {!upgrading && upgradeProgress < 100 && availableUpdate && (
                <Button variant="primary" onClick={startUpgrade}>
                  Update to {availableUpdate}
                </Button>
              )}
              {!availableUpdate && !upgrading && upgradeProgress < 100 && (
                <Label color="green" icon={<CheckCircleIcon />}>Up to date</Label>
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
            {!upgrading && upgradeProgress < 100 && availableUpdate && (
              <div className="os-cluster-settings__update-info">
                <div className="os-cluster-settings__update-available">
                  <strong>Available update:</strong> {availableUpdate}
                </div>
                <div className="os-cluster-settings__update-channel">
                  Channel: {channel}
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
                    <DescriptionListTerm>Cluster ID</DescriptionListTerm>
                    <DescriptionListDescription className="os-cluster-settings__cluster-id">{clusterID}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Version</DescriptionListTerm>
                    <DescriptionListDescription><Label color="blue">{currentVersion}</Label></DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Platform</DescriptionListTerm>
                    <DescriptionListDescription>{platform} {region !== '-' ? `(${region})` : ''}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Channel</DescriptionListTerm>
                    <DescriptionListDescription>{channel}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>API Server</DescriptionListTerm>
                    <DescriptionListDescription><code>{apiServer}</code></DescriptionListDescription>
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
                </DescriptionList>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
}
