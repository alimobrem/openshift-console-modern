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
  Label,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';

interface Event {
  type: 'Normal' | 'Warning' | 'Error';
  reason: string;
  object: string;
  message: string;
  source: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
}

const mockEvents: Event[] = [
  {
    type: 'Normal',
    reason: 'Pulled',
    object: 'Pod/frontend-7d8f9b5c4d-x7k2m',
    message: 'Container image "nginx:1.21" already present on machine',
    source: 'kubelet',
    count: 1,
    firstSeen: '2m',
    lastSeen: '2m',
  },
  {
    type: 'Normal',
    reason: 'Started',
    object: 'Pod/frontend-7d8f9b5c4d-x7k2m',
    message: 'Started container frontend',
    source: 'kubelet',
    count: 1,
    firstSeen: '2m',
    lastSeen: '2m',
  },
  {
    type: 'Warning',
    reason: 'BackOff',
    object: 'Pod/backend-api-5d6c8b7f9d-p4t8h',
    message: 'Back-off restarting failed container',
    source: 'kubelet',
    count: 5,
    firstSeen: '10m',
    lastSeen: '1m',
  },
  {
    type: 'Normal',
    reason: 'ScalingReplicaSet',
    object: 'Deployment/frontend',
    message: 'Scaled up replica set frontend-7d8f9b5c4d to 3',
    source: 'deployment-controller',
    count: 1,
    firstSeen: '15m',
    lastSeen: '15m',
  },
  {
    type: 'Normal',
    reason: 'SuccessfulCreate',
    object: 'ReplicaSet/frontend-7d8f9b5c4d',
    message: 'Created pod: frontend-7d8f9b5c4d-x7k2m',
    source: 'replicaset-controller',
    count: 1,
    firstSeen: '15m',
    lastSeen: '15m',
  },
  {
    type: 'Warning',
    reason: 'FailedScheduling',
    object: 'Pod/database-0',
    message: 'pod has unbound immediate PersistentVolumeClaims',
    source: 'default-scheduler',
    count: 3,
    firstSeen: '30m',
    lastSeen: '25m',
  },
  {
    type: 'Normal',
    reason: 'NodeReady',
    object: 'Node/worker-0',
    message: 'Node worker-0 status is now: NodeReady',
    source: 'node-controller',
    count: 1,
    firstSeen: '2h',
    lastSeen: '2h',
  },
  {
    type: 'Error',
    reason: 'FailedMount',
    object: 'Pod/broken-pod-abc123',
    message: 'MountVolume.SetUp failed for volume "data": mount failed',
    source: 'kubelet',
    count: 12,
    firstSeen: '1h',
    lastSeen: '5m',
  },
];

export default function Events() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredEvents = mockEvents.filter(
    (event) =>
      event.object.toLowerCase().includes(searchValue.toLowerCase()) ||
      event.reason.toLowerCase().includes(searchValue.toLowerCase()) ||
      event.message.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'Normal':
        return 'green';
      case 'Warning':
        return 'orange';
      case 'Error':
        return 'red';
      default:
        return 'grey';
    }
  };

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Events
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          View cluster-wide events and activity
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="events-toolbar">
              <ToolbarContent>
                <ToolbarItem variant="search-filter">
                  <SearchInput
                    placeholder="Search by object, reason, or message"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Events table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Type</Th>
                  <Th>Reason</Th>
                  <Th>Object</Th>
                  <Th>Message</Th>
                  <Th>Source</Th>
                  <Th>Count</Th>
                  <Th>Last Seen</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event, idx) => (
                    <Tr key={`${event.object}-${event.reason}-${idx}`}>
                      <Td dataLabel="Type">
                        <Label color={getTypeColor(event.type)}>{event.type}</Label>
                      </Td>
                      <Td dataLabel="Reason">
                        <strong>{event.reason}</strong>
                      </Td>
                      <Td dataLabel="Object">
                        <code style={{ fontSize: '0.875rem' }}>{event.object}</code>
                      </Td>
                      <Td dataLabel="Message" style={{ maxWidth: '400px' }}>
                        {event.message}
                      </Td>
                      <Td dataLabel="Source">{event.source}</Td>
                      <Td dataLabel="Count">{event.count}</Td>
                      <Td dataLabel="Last Seen">{event.lastSeen}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={7} style={{ textAlign: 'center' }}>
                      {searchValue ? 'No events found matching your search' : 'No events found'}
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
