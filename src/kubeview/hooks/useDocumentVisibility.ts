import { useState, useEffect } from 'react';

/**
 * Returns true when the document is visible (tab is focused).
 * Used to pause polling when the tab is in the background.
 */
export function useDocumentVisibility(): boolean {
  const [visible, setVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true,
  );

  useEffect(() => {
    const handler = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return visible;
}
