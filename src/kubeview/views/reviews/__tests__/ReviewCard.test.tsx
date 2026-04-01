// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import type { ReviewItem } from '../../../store/reviewStore';

vi.mock('../../../store/reviewStore', () => ({
  useReviewStore: (sel: any) => sel({
    expandedId: null,
    setExpanded: vi.fn(),
  }),
}));

vi.mock('../../../engine/dateUtils', () => ({
  formatAge: () => '5m ago',
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

vi.mock('../ReviewDetail', () => ({
  ReviewDetail: () => <div data-testid="review-detail" />,
}));

import { ReviewCard } from '../ReviewCard';

const mockReview: ReviewItem = {
  id: 'rev-001',
  title: 'Scale payment-api to 3 replicas',
  description: 'Increase replicas for payment-api deployment',
  agentIcon: 'bot',
  agentLabel: 'SRE Agent',
  riskLevel: 'low',
  status: 'pending',
  resource: { kind: 'Deployment', name: 'payment-api', namespace: 'payments' },
  diff: { before: 'replicas: 1', after: 'replicas: 3' },
  reasoning: 'High traffic detected',
  timestamp: Date.now(),
  category: 'scale',
};

describe('ReviewCard', () => {
  it('renders without crashing', () => {
    render(<ReviewCard review={mockReview} />);
  });

  it('shows review title', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getAllByText(/scale payment-api/i).length).toBeGreaterThan(0);
  });

  it('shows risk badge', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getAllByText('Low').length).toBeGreaterThan(0);
  });

  it('has expandable button', () => {
    render(<ReviewCard review={mockReview} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
