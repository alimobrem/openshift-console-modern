// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

import WelcomeView from '../WelcomeView';

function renderView() {
  let navigatedTo = '';
  return {
    ...render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="welcome" element={<WelcomeView />} />
          <Route path="pulse" element={<div data-testid="pulse-landing">Pulse</div>} />
        </Routes>
      </MemoryRouter>,
    ),
    getNavigatedTo: () => navigatedTo,
  };
}

describe('WelcomeView', () => {
  afterEach(cleanup);

  it('redirects to /pulse', () => {
    const { getByTestId } = renderView();
    expect(getByTestId('pulse-landing')).toBeDefined();
  });
});
