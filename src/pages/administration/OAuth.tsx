import {
  PageSection,
  Title,
  Card,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
} from '@patternfly/react-core';
import '@/openshift-components.css';

interface IdentityProvider {
  name: string;
  type: string;
  mappingMethod: string;
}

const identityProviders: IdentityProvider[] = [
  { name: 'htpasswd_provider', type: 'HTPasswd', mappingMethod: 'claim' },
  { name: 'ldap_provider', type: 'LDAP', mappingMethod: 'claim' },
];

export default function OAuth() {
  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">OAuth</Title>
        <p className="os-list__description">
          Cluster OAuth configuration and identity providers
        </p>
      </PageSection>

      <PageSection>
        <Card className="pf-v5-u-mb-lg">
          <CardBody>
            <Title headingLevel="h3" size="lg" className="pf-v5-u-mb-md">OAuth Server Configuration</Title>
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>API Version</DescriptionListTerm>
                <DescriptionListDescription>config.openshift.io/v1</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Kind</DescriptionListTerm>
                <DescriptionListDescription>OAuth</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription>cluster</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Token Max Age</DescriptionListTerm>
                <DescriptionListDescription>168h0m0s</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Token Inactivity Timeout</DescriptionListTerm>
                <DescriptionListDescription>300s</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>

        <Card className="pf-v5-u-mb-lg">
          <CardBody>
            <Title headingLevel="h3" size="lg" className="pf-v5-u-mb-md">Identity Providers</Title>
            {identityProviders.map((idp) => (
              <Card key={idp.name} className="pf-v5-u-mb-sm" isPlain>
                <CardBody>
                  <DescriptionList isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>
                        <strong>{idp.name}</strong>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Type</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Label color="blue">{idp.type}</Label>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Mapping Method</DescriptionListTerm>
                      <DescriptionListDescription>{idp.mappingMethod}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </CardBody>
              </Card>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Title headingLevel="h3" size="lg" className="pf-v5-u-mb-md">Session Configuration</Title>
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>Session Max Age</DescriptionListTerm>
                <DescriptionListDescription>3600s</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Session Inactivity Timeout</DescriptionListTerm>
                <DescriptionListDescription>300s</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
}
