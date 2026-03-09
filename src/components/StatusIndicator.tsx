import { Label } from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
  InProgressIcon,
  BanIcon,
  PausedIcon,
} from '@patternfly/react-icons';

type StatusType =
  | 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'inactive' | 'unknown';

const statusMap: Record<string, { type: StatusType; color: 'green' | 'orange' | 'red' | 'blue' | 'grey' | 'purple' | 'teal' }> = {
  // Pod/container statuses
  Running: { type: 'success', color: 'green' },
  Pending: { type: 'pending', color: 'orange' },
  Failed: { type: 'danger', color: 'red' },
  Succeeded: { type: 'success', color: 'green' },
  Unknown: { type: 'unknown', color: 'grey' },
  // Deployment statuses
  Available: { type: 'success', color: 'green' },
  Progressing: { type: 'pending', color: 'blue' },
  // Node statuses
  Ready: { type: 'success', color: 'green' },
  NotReady: { type: 'danger', color: 'red' },
  // PV/PVC statuses
  Bound: { type: 'success', color: 'green' },
  Released: { type: 'warning', color: 'orange' },
  // Namespace statuses
  Active: { type: 'success', color: 'green' },
  Terminating: { type: 'warning', color: 'orange' },
  // Build statuses
  Complete: { type: 'success', color: 'green' },
  Cancelled: { type: 'warning', color: 'orange' },
  // Event types
  Normal: { type: 'info', color: 'green' },
  Warning: { type: 'warning', color: 'orange' },
  Error: { type: 'danger', color: 'red' },
  // Generic
  True: { type: 'success', color: 'green' },
  False: { type: 'inactive', color: 'grey' },
  Healthy: { type: 'success', color: 'green' },
  Degraded: { type: 'warning', color: 'orange' },
  // Operator statuses
  Installing: { type: 'pending', color: 'blue' },
  // Machine phases
  Provisioning: { type: 'pending', color: 'blue' },
  Provisioned: { type: 'success', color: 'teal' },
  Deleting: { type: 'warning', color: 'orange' },
  // Alert states
  firing: { type: 'danger', color: 'red' },
  pending: { type: 'warning', color: 'orange' },
  inactive: { type: 'inactive', color: 'grey' },
  // Severity
  critical: { type: 'danger', color: 'red' },
  warning: { type: 'warning', color: 'orange' },
  info: { type: 'info', color: 'blue' },
  // Service types
  ClusterIP: { type: 'success', color: 'green' },
  NodePort: { type: 'info', color: 'blue' },
  LoadBalancer: { type: 'info', color: 'purple' },
  ExternalName: { type: 'info', color: 'teal' },
  // Up to date
  'Up to date': { type: 'success', color: 'green' },
  Updating: { type: 'pending', color: 'orange' },
  // Admitted
  Admitted: { type: 'success', color: 'green' },
};

const iconMap: Record<StatusType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  danger: ExclamationCircleIcon,
  info: InfoCircleIcon,
  pending: InProgressIcon,
  inactive: PausedIcon,
  unknown: BanIcon,
};

interface StatusIndicatorProps {
  status: string;
  pulse?: boolean;
  iconOnly?: boolean;
}

export default function StatusIndicator({ status, pulse, iconOnly }: StatusIndicatorProps) {
  const mapping = statusMap[status] ?? { type: 'unknown' as StatusType, color: 'grey' as const };
  const Icon = iconMap[mapping.type];

  if (iconOnly) {
    return (
      <span className={pulse ? 'compass-status-pulse' : undefined}>
        <Icon />
      </span>
    );
  }

  const labelProps = pulse ? { className: 'compass-status-pulse' } : {};

  return (
    <Label
      color={mapping.color}
      icon={<Icon />}
      {...labelProps}
    >
      {status}
    </Label>
  );
}

export function getStatusColor(status: string): 'green' | 'orange' | 'red' | 'blue' | 'grey' | 'purple' | 'teal' {
  return statusMap[status]?.color ?? 'grey';
}
