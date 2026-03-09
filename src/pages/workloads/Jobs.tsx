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

interface Job {
  name: string;
  namespace: string;
  completions: string;
  duration: string;
  status: 'Complete' | 'Running' | 'Failed';
  age: string;
}

const mockJobs: Job[] = [
  {
    name: 'backup-database-20260301',
    namespace: 'default',
    completions: '1/1',
    duration: '45s',
    status: 'Complete',
    age: '2d',
  },
  {
    name: 'data-migration-job',
    namespace: 'database',
    completions: '1/1',
    duration: '2m30s',
    status: 'Complete',
    age: '5d',
  },
  {
    name: 'cleanup-old-logs',
    namespace: 'logging',
    completions: '3/3',
    duration: '15s',
    status: 'Complete',
    age: '1d',
  },
  {
    name: 'process-batch-data',
    namespace: 'analytics',
    completions: '0/1',
    duration: '30s',
    status: 'Running',
    age: '30s',
  },
  {
    name: 'failed-import-job',
    namespace: 'default',
    completions: '0/1',
    duration: '1m',
    status: 'Failed',
    age: '3d',
  },
];

export default function Jobs() {
  const [searchValue, setSearchValue] = React.useState('');

  const filteredJobs = mockJobs.filter(
    (job) =>
      job.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      job.namespace.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'Complete':
        return 'green';
      case 'Running':
        return 'blue';
      case 'Failed':
        return 'red';
      default:
        return 'grey';
    }
  };

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1" size="2xl">
          Jobs
        </Title>
        <p style={{ marginTop: '8px', color: 'var(--pf-v6-global--Color--200)' }}>
          Manage one-time and batch processing tasks
        </p>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <Toolbar id="jobs-toolbar">
              <ToolbarContent>
                <ToolbarItem>
                  <SearchInput
                    placeholder="Search by name or namespace"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue('')}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="primary" icon={<PlusCircleIcon />}>
                    Create Job
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Jobs table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Namespace</Th>
                  <Th>Completions</Th>
                  <Th>Duration</Th>
                  <Th>Status</Th>
                  <Th>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <Tr key={`${job.namespace}-${job.name}`}>
                      <Td dataLabel="Name">
                        <strong>{job.name}</strong>
                      </Td>
                      <Td dataLabel="Namespace">{job.namespace}</Td>
                      <Td dataLabel="Completions">{job.completions}</Td>
                      <Td dataLabel="Duration">{job.duration}</Td>
                      <Td dataLabel="Status">
                        <Label color={getStatusColor(job.status)}>{job.status}</Label>
                      </Td>
                      <Td dataLabel="Age">{job.age}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={6} style={{ textAlign: 'center' }}>
                      {searchValue ? 'No Jobs found matching your search' : 'No Jobs found'}
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
