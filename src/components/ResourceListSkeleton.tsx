import { Card, CardBody } from '@patternfly/react-core';

interface ResourceListSkeletonProps {
  columns: number;
  rows?: number;
}

export default function ResourceListSkeleton({ columns, rows = 5 }: ResourceListSkeletonProps) {
  return (
    <Card>
      <CardBody>
        {/* Toolbar skeleton */}
        <div className="os-skeleton__toolbar">
          <div className="compass-skeleton os-skeleton__toolbar-search" />
          <div className="compass-skeleton os-skeleton__toolbar-button" />
        </div>
        {/* Header row */}
        <div className="os-skeleton__header-row">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="compass-skeleton os-skeleton__header-cell" />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="os-skeleton__data-row"
            style={{ '--os-skeleton-delay': `${r * 0.08}s`, animationDelay: 'var(--os-skeleton-delay)' } as React.CSSProperties}
          >
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className={`compass-skeleton os-skeleton__data-cell ${c === 0 ? 'os-skeleton__data-cell--primary' : 'os-skeleton__data-cell--secondary'}`}
              />
            ))}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
