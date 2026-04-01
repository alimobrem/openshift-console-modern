/**
 * P0 behavioral tests for ConfirmDialog and icon registry.
 */

// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { ConfirmDialog } from '../components/feedback/ConfirmDialog';

describe('P0: ConfirmDialog focus behavior', () => {
  it('focuses Cancel button for danger variant', () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete resource?"
        description="This cannot be undone."
        variant="danger"
      />
    );
    const cancelButton = screen.getByText('Cancel');
    expect(document.activeElement).toBe(cancelButton);
  });

  it('focuses Confirm button for warning variant', () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Start update?"
        description="This will restart nodes."
        confirmLabel="Start Update"
        variant="warning"
      />
    );
    const confirmButton = screen.getByText('Start Update');
    expect(document.activeElement).toBe(confirmButton);
  });

  it('does not render when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete?"
        description="Gone forever."
      />
    );
    expect(screen.queryByText('Delete?')).toBeNull();
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog open={true} onClose={onClose} onConfirm={vi.fn()} title="Delete?" description="Sure?" />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close on Escape when loading', () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog open={true} onClose={onClose} onConfirm={vi.fn()} title="Delete?" description="Sure?" loading={true} />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('P1: Icon registry', () => {
  it('icon registry exports getResourceIcon', async () => {
    const { getResourceIcon } = await import('../engine/iconRegistry');
    expect(typeof getResourceIcon).toBe('function');
    const icon = getResourceIcon('Box');
    expect(icon).toBeDefined();
  });
});

describe('P1: Discovery cache', () => {
  it('exports invalidateDiscoveryCache', async () => {
    const { invalidateDiscoveryCache } = await import('../engine/discovery');
    expect(typeof invalidateDiscoveryCache).toBe('function');
    expect(() => invalidateDiscoveryCache()).not.toThrow();
  });
});
