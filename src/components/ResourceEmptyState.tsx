import { CubeIcon } from '@patternfly/react-icons';

interface ResourceEmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export default function ResourceEmptyState({ title, message, icon }: ResourceEmptyStateProps) {
  return (
    <div className="compass-empty-state">
      <div className="compass-empty-state__icon">
        {icon ?? <CubeIcon />}
      </div>
      <div className="compass-empty-state__title">{title}</div>
      <div className="compass-empty-state__message">{message}</div>
    </div>
  );
}
