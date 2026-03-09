import { PageSection, Title, Card, CardTitle, CardBody } from '@patternfly/react-core';

export default function NetworkingPF() {
  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Networking
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Configure services, routes, and network policies
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardTitle>
            <Title headingLevel="h3">Services</Title>
          </CardTitle>
          <CardBody>
            <p style={{ color: 'var(--pf-v6-global--Color--200)' }}>
              Networking configuration coming soon...
            </p>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
}
