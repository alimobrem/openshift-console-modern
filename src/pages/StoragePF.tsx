import { PageSection, Title, Card, CardTitle, CardBody } from '@patternfly/react-core';

export default function StoragePF() {
  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Storage
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage persistent volumes and storage classes
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardTitle>
            <Title headingLevel="h3">Persistent Volumes</Title>
          </CardTitle>
          <CardBody>
            <p style={{ color: 'var(--pf-v6-global--Color--200)' }}>
              Storage management coming soon...
            </p>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
}
