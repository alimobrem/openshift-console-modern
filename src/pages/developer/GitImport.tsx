import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Button,
} from '@patternfly/react-core';
import { useUIStore } from '@/store/useUIStore';

export default function GitImport() {
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();
  const [gitRepo, setGitRepo] = React.useState('');
  const [gitRef, setGitRef] = React.useState('');
  const [contextDir, setContextDir] = React.useState('');
  const [appName, setAppName] = React.useState('');
  const [name, setName] = React.useState('');
  const [targetPort, setTargetPort] = React.useState(8080);
  const [creating, setCreating] = React.useState(false);

  const handleCreate = async () => {
    if (!gitRepo || !name) return;
    setCreating(true);
    try {
      const res = await fetch('/api/kubernetes/apis/apps/v1/namespaces/default/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: {
            name,
            namespace: 'default',
            labels: { app: name },
          },
          spec: {
            replicas: 1,
            selector: { matchLabels: { app: name } },
            template: {
              metadata: { labels: { app: name } },
              spec: {
                containers: [{
                  name,
                  image: gitRepo,
                  ports: [{ containerPort: targetPort }],
                }],
              },
            },
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || `${res.status} ${res.statusText}`);
      }

      addToast({
        type: 'success',
        title: 'Deployment created',
        description: `Deployment "${name}" has been created successfully`,
      });
      navigate('/workloads/deployments');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to create deployment',
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">Import from Git</Title>
        <p className="os-list__description">
          Deploy an application from a Git repository
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <div className="os-deploy__step-fields">
              <div className="os-deploy__field">
                <label className="os-deploy__label">
                  Git Repo URL <span className="os-deploy__required">*</span>
                </label>
                <input
                  className="os-deploy__input"
                  type="text"
                  placeholder="https://github.com/user/repo.git"
                  value={gitRepo}
                  onChange={(e) => setGitRepo(e.target.value)}
                />
              </div>

              <div className="os-deploy__field">
                <label className="os-deploy__label">Git Reference</label>
                <input
                  className="os-deploy__input"
                  type="text"
                  placeholder="main"
                  value={gitRef}
                  onChange={(e) => setGitRef(e.target.value)}
                />
              </div>

              <div className="os-deploy__field">
                <label className="os-deploy__label">Context Dir</label>
                <input
                  className="os-deploy__input"
                  type="text"
                  placeholder="/"
                  value={contextDir}
                  onChange={(e) => setContextDir(e.target.value)}
                />
              </div>

              <div className="os-deploy__field">
                <label className="os-deploy__label">
                  Application Name <span className="os-deploy__required">*</span>
                </label>
                <input
                  className="os-deploy__input"
                  type="text"
                  placeholder="my-app"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                />
              </div>

              <div className="os-deploy__field">
                <label className="os-deploy__label">
                  Name <span className="os-deploy__required">*</span>
                </label>
                <input
                  className="os-deploy__input"
                  type="text"
                  placeholder="my-app"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="os-deploy__field">
                <label className="os-deploy__label">Target Port</label>
                <input
                  className="os-deploy__input os-deploy__input--port"
                  type="number"
                  placeholder="8080"
                  value={targetPort}
                  onChange={(e) => setTargetPort(Number(e.target.value))}
                />
              </div>

              <div className="os-deploy__actions">
                <Button
                  variant="primary"
                  onClick={handleCreate}
                  isDisabled={!gitRepo || !name || creating}
                  isLoading={creating}
                >
                  Create
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
}
