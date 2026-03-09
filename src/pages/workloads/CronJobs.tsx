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
  Button,
  Label,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { PlusCircleIcon } from '@patternfly/react-icons';

interface CronJob {
  name: string;
  namespace: string;
  schedule: string;
  suspend: boolean;
  active: number;
  lastSchedule: string;
  age: string;
}

const mockCronJobs: CronJob[] = [
  {
    name: 'backup-daily',
    namespace: 'default',
    schedule: '0 2 * * *',
    suspend: false,
    active: 0,
    lastSchedule: '2h',
    age: '90d',
  },
  {
    name: 'cleanup-logs-weekly',
    namespace: 'logging',
    schedule: '0 3 * * 0',
    suspend: false,
    active: 0,
    lastSchedule: '5d',
    age: '60d',
  },
  {
    name: 'report-generator',
    namespace: 'analytics',
    schedule: '0 8 * * 1',
    suspend: false,
    active: 1,
    lastSchedule: '30m',
    age: '45d',
  },
  {
    name: 'cache-refresh',
    namespace: 'cache',
    schedule: '*/15 * * * *',
    suspend: false,
    active: 0,
    lastSchedule: '10m',
    age: '30d',
  },
  {
    name: 'maintenance-job',
    namespace: 'default',
    schedule: '0 4 * * *',
    suspend: true,
    active: 0,
    lastSchedule: '1d',
    age: '20d',
  },
];

export default function CronJobs() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredCronJobs = mockCronJobs.filter(
    (cron) =>
      cron.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      cron.namespace.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          CronJobs
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage scheduled jobs that run on a repeating schedule
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="cronjobs-toolbar">
              <ToolbarContent>
                <ToolbarItem variant="search-filter">
                  <SearchInput
                    placeholder="Search by name or namespace"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="primary" icon={<PlusCircleIcon />}>
                    Create CronJob
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="CronJobs table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Schedule</Th>
                  <Th>Suspend</Th>
                  <Th>Active</Th>
                  <Th>Last Schedule</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredCronJobs.length > 0 ? (
                  filteredCronJobs.map((cron) => (
                    <Tr key={`${cron.namespace}-${cron.name}`}>
                      <Td dataLabel="Name">
                        <strong>{cron.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{cron.namespace}</Td>
                      <Td dataLabel="Schedule">
                        <code style={{ fontSize: '0.875rem' }}>{cron.schedule}</code>
                      </Td>
                      <Td dataLabel="Suspend">
                        <Label color={cron.suspend ? 'orange' : 'green'}>
                          {cron.suspend ? 'Yes' : 'No'}
                        </Label>
                      </Td>
                      <Td dataLabel="Active">
                        {cron.active > 0 ? (
                          <Label color="blue">{cron.active}</Label>
                        ) : (
                          <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>0</span>
                        )}
                      </Td>
                      <Td dataLabel="Last Schedule">{cron.lastSchedule}</Td>
                      <Td dataLabel="Age">{cron.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={7} style={{ textAlign: 'center' }}>
                      {searchValue ? 'No CronJobs found matching your search' : 'No CronJobs found'}
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
