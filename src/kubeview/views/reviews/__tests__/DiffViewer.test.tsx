// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

import { DiffViewer } from '../DiffViewer';

describe('DiffViewer', () => {
  it('renders without crashing', () => {
    render(<DiffViewer diff={{ before: 'replicas: 1', after: 'replicas: 3' }} />);
  });

  it('renders added content', () => {
    const { container } = render(
      <DiffViewer diff={{ before: 'a: 1', after: 'a: 1\nb: 2' }} />
    );
    expect(container.textContent).toContain('b: 2');
  });

  it('renders removed content', () => {
    const { container } = render(
      <DiffViewer diff={{ before: 'a: 1\nb: 2', after: 'a: 1' }} />
    );
    expect(container.textContent).toContain('b: 2');
  });

  it('renders unchanged content', () => {
    const { container } = render(
      <DiffViewer diff={{ before: 'same line', after: 'same line' }} />
    );
    expect(container.textContent).toContain('same line');
  });

  it('handles empty diff', () => {
    render(<DiffViewer diff={{ before: '', after: '' }} />);
  });
});
