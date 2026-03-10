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
  const [updating, setUpdating] = React.useState(false);

  const { data: clusterVersions, refetch } = useK8sResource<RawClusterVersion, RawClusterVersion>(
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

  const progressingCondition = cv?.status?.conditions?.find((c) => c.type === 'Progressing');
  const isProgressing = progressingCondition?.status === 'True';
  const progressMessage = progressingCondition?.message ?? '';

  // Extract progress percentage from the condition message if available (e.g., "Working towards 4.14.5: 45% complete")
  const progressMatch = progressMessage.match(/(\d+)%/);
  const progressValue = progressMatch ? parseInt(progressMatch[1], 10) : 0;

  const startUpgrade = async () => {
    if (!availableUpdate) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/kubernetes/apis/config.openshift.io/v1/clusterversions/version', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/strategic-merge-patch+json' },
        body: JSON.stringify({
          spec: { desiredUpdate: { version: availableUpdate } },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || `${res.status} ${res.statusText}`);
      }

      addToast({
        type: 'info',
        title: 'Cluster update initiated',
        description: `Upgrading to ${availableUpdate}...`,
      });
      refetch();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Cluster update failed',
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setUpdating(false);
    }
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
              {!isProgressing && availableUpdate && (
                <Button
                  variant="primary"
                  onClick={startUpgrade}
                  isDisabled={updating}
                  isLoading={updating}
                >
                  Update to {availableUpdate}
                </Button>
              )}
              {!availableUpdate && !isProgressing && (
                <Label color="green" icon={<CheckCircleIcon />}>Up to date</Label>
              )}
            </div>
            {isProgressing && (
              <div>
                <div className="os-cluster-settings__upgrade-progress-row">
                  <InProgressIcon className="os-cluster-settings__upgrade-spinner" />
                  <span className="os-cluster-settings__upgrade-label">
                    {progressMessage || 'Upgrading cluster...'}
                  </span>
                </div>
                <Progress value={progressValue} variant={ProgressVariant.success} />
                <div className="os-cluster-settings__upgrade-detail">
                  Updating control plane components, operators, and worker nodes...
                </div>
              </div>
            )}
            {!isProgressing && availableUpdate && (
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
