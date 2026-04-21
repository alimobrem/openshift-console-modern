// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InboxLifecycleBadge, InboxLifecycleStepper } from '../InboxLifecycle';

describe('InboxLifecycleBadge', () => {
  it('renders universal lifecycle stages', () => {
    render(<InboxLifecycleBadge itemType="finding" status="acknowledged" />);
    expect(screen.getAllByText('New').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('AI Review').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Attention').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Resolved').length).toBeGreaterThanOrEqual(1);
  });

  it('renders same stages for tasks', () => {
    render(<InboxLifecycleBadge itemType="task" status="new" />);
    expect(screen.getAllByText('New').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Resolved').length).toBeGreaterThanOrEqual(1);
  });

  it('renders same stages for assessments', () => {
    render(<InboxLifecycleBadge itemType="assessment" status="acknowledged" />);
    expect(screen.getAllByText('Attention').length).toBeGreaterThanOrEqual(1);
  });

  it('highlights current status with pulse for agent_reviewing', () => {
    const { container } = render(<InboxLifecycleBadge itemType="finding" status="agent_reviewing" />);
    const pulsingEl = container.querySelector('.animate-pulse');
    expect(pulsingEl).not.toBeNull();
  });

  it('shows Cleared for agent_cleared', () => {
    render(<InboxLifecycleBadge itemType="finding" status="agent_cleared" />);
    expect(screen.getAllByText(/Cleared/).length).toBeGreaterThanOrEqual(1);
  });
});

describe('InboxLifecycleStepper', () => {
  it('renders universal stepper', () => {
    render(<InboxLifecycleStepper itemType="finding" status="acknowledged" />);
    expect(screen.getAllByText('New').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Attention').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Resolved').length).toBeGreaterThanOrEqual(1);
  });

  it('maps task in_progress to universal In Progress', () => {
    render(<InboxLifecycleStepper itemType="task" status="in_progress" />);
    expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
  });
});
