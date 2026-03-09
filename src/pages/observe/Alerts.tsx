import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  Select,
  SelectOption,
  MenuToggle,
  Label,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';

interface Alert {
  name: string;
  severity: 'critical' | 'warning' | 'info';
  state: 'firing' | 'pending' | 'inactive';
  message: string;
  source: string;
  activeSince: string;
}

const mockAlerts: Alert[] = [
  {
    name: 'HighPodMemoryUsage',
    severity: 'warning',
    state: 'firing',
    message: 'Pod memory usage is above 90%',
    source: 'prometheus',
    activeSince: '15m',
  },
  {
    name: 'NodeDiskPressure',
    severity: 'critical',
    state: 'firing',
    message: 'Node is experiencing disk pressure',
    source: 'kubelet',
    activeSince: '5m',
  },
  {
    name: 'PodCrashLooping',
    severity: 'warning',
    state: 'firing',
    message: 'Pod is crash looping',
    source: 'kube-state-metrics',
    activeSince: '30m',
  },
  {
    name: 'APIServerLatency',
    severity: 'info',
    state: 'pending',
    message: 'API server request latency is elevated',
    source: 'prometheus',
    activeSince: '2m',
  },
  {
    name: 'EtcdHighCommitDuration',
    severity: 'warning',
    state: 'firing',
    message: 'Etcd commit duration is high',
    source: 'prometheus',
    activeSince: '10m',
  },
];

export default function Alerts() {
  const [searchValue, setSearchValue] = React.useState('');
  const [severityFilter, setSeverityFilter] = React.useState('All Severities');
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);

  const severityOptions = ['All Severities', 'critical', 'warning', 'info'];

  const filteredAlerts = mockAlerts.filter((alert) => {
    const matchesSearch =
      alert.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchValue.toLowerCase());

    const matchesSeverity =
      severityFilter === 'All Severities' || alert.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'warning':
        return 'orange';
      case 'info':
        return 'blue';
      default:
        return 'grey';
    }
  };

  const getStateColor = (state: Alert['state']) => {
    switch (state) {
      case 'firing':
        return 'red';
      case 'pending':
        return 'orange';
      case 'inactive':
        return 'grey';
      default:
        return 'grey';
    }
  };

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Alerts
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          View and manage Prometheus alerts
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="alerts-toolbar">
              <ToolbarContent>
                <ToolbarItem variant="search-filter" style={{ flexGrow: 1 }}>
                  <SearchInput
                    placeholder="Search alerts by name or message..."
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Select
                    id="severity-select"
                    isOpen={isSelectOpen}
                    selected={severityFilter}
                    onSelect={(_event, selection) => {
                      setSeverityFilter(selection as string);
                      setIsSelectOpen(false);
                    }}
                    onOpenChange={(isOpen) => setIsSelectOpen(isOpen)}
                    toggle={(toggleRef) => (
                      <MenuToggle ref={toggleRef} onClick={() => setIsSelectOpen(!isSelectOpen)}>
                        {severityFilter}
                      </MenuToggle>
                    )}
                  >
                    {severityOptions.map((option) => (
                      <SelectOption key={option} value={option}>
                        {option}
                      </SelectOption>
                    ))}
                  </Select>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Alerts table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Alert</Th>
                  <Th>Severity</Th>
                  <Th>State</Th>
                  <Th>Message</Th>
                  <Th>Source</Th>
                  <Th>Active Since</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map((alert, idx) => (
                    <Tr key={`${alert.name}-${idx}`}>
                      <Td dataLabel="Alert">
                        <strong>{alert.name}</strong>
                      </Td>
                      <Td dataLabel="Severity">
                        <Label color={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Label>
                      </Td>
                      <Td dataLabel="State">
                        <Label color={getStateColor(alert.state)}>{alert.state}</Label>
                      </Td>
                      <Td dataLabel="Message" style={{ maxWidth: '400px' }}>
                        {alert.message}
                      </Td>
                      <Td dataLabel="Source">{alert.source}</Td>
                      <Td dataLabel="Active Since">{alert.activeSince}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={6} style={{ textAlign: 'center' }}>
                      {searchValue ? 'No alerts found matching your search' : 'No alerts found'}
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
}
