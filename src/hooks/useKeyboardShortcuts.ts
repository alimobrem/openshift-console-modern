import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const pendingKey = useRef<string | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Cmd+K always works
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      if (isInput) return;

      // Two-key shortcuts: g+h, g+p, g+d, g+n
      if (pendingKey.current === 'g') {
        pendingKey.current = null;
        if (pendingTimer.current) clearTimeout(pendingTimer.current);
        switch (e.key) {
          case 'h': navigate('/home/overview'); break;
          case 'p': navigate('/workloads/pods'); break;
          case 'd': navigate('/workloads/deployments'); break;
          case 'n': navigate('/compute/nodes'); break;
          case 's': navigate('/networking/services'); break;
          case 'e': navigate('/home/events'); break;
        }
        return;
      }

      if (e.key === 'g') {
        pendingKey.current = 'g';
        pendingTimer.current = setTimeout(() => { pendingKey.current = null; }, 500);
        return;
      }

      if (e.key === '?') {
        // Could open shortcuts modal in the future
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, toggleCommandPalette]);
}
