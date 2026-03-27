// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/test', search: '' }),
}));

import { useUnsavedChanges } from '../useUnsavedChanges';

describe('useUnsavedChanges', () => {
  let addEventSpy: ReturnType<typeof vi.spyOn>;
  let removeEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    addEventSpy = vi.spyOn(window, 'addEventListener');
    removeEventSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    cleanup();
    addEventSpy.mockRestore();
    removeEventSpy.mockRestore();
  });

  it('does not add beforeunload listener when hasChanges is false', () => {
    renderHook(() => useUnsavedChanges(false));
    const beforeunloadCalls = addEventSpy.mock.calls.filter(([type]) => type === 'beforeunload');
    expect(beforeunloadCalls.length).toBe(0);
  });

  it('adds beforeunload listener when hasChanges is true', () => {
    renderHook(() => useUnsavedChanges(true));
    const beforeunloadCalls = addEventSpy.mock.calls.filter(([type]) => type === 'beforeunload');
    expect(beforeunloadCalls.length).toBe(1);
  });

  it('removes beforeunload listener on cleanup', () => {
    const { unmount } = renderHook(() => useUnsavedChanges(true));
    unmount();
    const removeCalls = removeEventSpy.mock.calls.filter(([type]) => type === 'beforeunload');
    expect(removeCalls.length).toBe(1);
  });

  it('adds popstate listener when hasChanges is true', () => {
    renderHook(() => useUnsavedChanges(true));
    const popstateCalls = addEventSpy.mock.calls.filter(([type]) => type === 'popstate');
    expect(popstateCalls.length).toBe(1);
  });

  it('does not add popstate listener when hasChanges is false', () => {
    renderHook(() => useUnsavedChanges(false));
    const popstateCalls = addEventSpy.mock.calls.filter(([type]) => type === 'popstate');
    expect(popstateCalls.length).toBe(0);
  });

  it('confirmNavigation hides dialog', () => {
    const { result } = renderHook(() => useUnsavedChanges(true));
    expect(result.current.showConfirm).toBe(false);

    act(() => result.current.confirmNavigation());
    expect(result.current.showConfirm).toBe(false);
  });

  it('cancelNavigation hides dialog', () => {
    const { result } = renderHook(() => useUnsavedChanges(true));

    act(() => result.current.cancelNavigation());
    expect(result.current.showConfirm).toBe(false);
  });
});
