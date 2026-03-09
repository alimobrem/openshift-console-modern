import { PageSection, Title, Card, CardTitle, CardBody } from '@patternfly/react-core';

export default function WorkloadsPF() {
  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Workloads
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage deployments, pods, and other workload resources
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardTitle>
            <Title headingLevel="h3">Deployments</Title>
          </CardTitle>
          <CardBody>
            <p style={{ color: 'var(--pf-v6-global--Color--200)' }}>
              Workloads management coming soon...
            </p>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
}
