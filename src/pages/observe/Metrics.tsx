import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Button,
  TextInput,
  CodeBlock,
  CodeBlockCode,
} from '@patternfly/react-core';
import { PlayIcon } from '@patternfly/react-icons';

export default function Metrics() {
  const [query, setQuery] = React.useState('');
  const [hasQueried, setHasQueried] = React.useState(false);

  const exampleQueries = [
    'node_cpu_seconds_total',
    'container_memory_usage_bytes',
    'kube_pod_status_phase',
    'node_filesystem_avail_bytes',
    'up',
  ];

  const handleRunQuery = () => {
    if (query.trim()) {
      setHasQueried(true);
    }
  };

  const mockResults = `# TYPE node_cpu_seconds_total counter
node_cpu_seconds_total{cpu="0",mode="idle"} 892346.12
node_cpu_seconds_total{cpu="0",mode="system"} 34521.45
node_cpu_seconds_total{cpu="0",mode="user"} 87634.23
node_cpu_seconds_total{cpu="1",mode="idle"} 891234.56
node_cpu_seconds_total{cpu="1",mode="system"} 35432.12
node_cpu_seconds_total{cpu="1",mode="user"} 88765.34`;

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Metrics
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Query Prometheus metrics using PromQL
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="metrics-toolbar">
              <ToolbarContent>
                <ToolbarItem style={{ flexGrow: 1 }}>
                  <TextInput
                    id="query-input"
                    type="text"
                    placeholder="Enter PromQL query (e.g., node_cpu_seconds_total)"
                    value={query}
                    onChange={(_event, value) => setQuery(value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleRunQuery();
                      }
                    }}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Button
                    variant="primary"
                    icon={<PlayIcon />}
                    onClick={handleRunQuery}
                    isDisabled={!query.trim()}
                  >
                    Run Query
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <div style={{ marginTop: '24px' }}>
              <Title headingLevel="h4" size="md" style={{ marginBottom: '12px' }}>
                Example Queries
              </Title>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {exampleQueries.map((example) => (
                  <Button
                    key={example}
                    variant="link"
                    onClick={() => setQuery(example)}
                    style={{ padding: '4px 8px' }}
                  >
                    <code style={{ fontSize: '0.875rem' }}>{example}</code>
                  </Button>
                ))}
              </div>
            </div>

            {hasQueried && query && (
              <div style={{ marginTop: '24px' }}>
                <Title headingLevel="h4" size="md" style={{ marginBottom: '12px' }}>
                  Results for: <code>{query}</code>
                </Title>
                <CodeBlock>
                  <CodeBlockCode>{mockResults}</CodeBlockCode>
                </CodeBlock>
              </div>
            )}

            {!hasQueried && (
              <div style={{ marginTop: '40px', textAlign: 'center', color: 'var(--pf-v6-global--Color--200)' }}>
                Enter a PromQL query above and click "Run Query" to view results
              </div>
            )}
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
}
