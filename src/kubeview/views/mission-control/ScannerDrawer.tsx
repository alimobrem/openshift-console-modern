import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { fetchScannerCoverage } from '../../engine/analyticsApi';

interface ScannerDrawerProps {
  onClose: () => void;
}

export function ScannerDrawer({ onClose }: ScannerDrawerProps) {
  const { data: coverage } = useQuery({
    queryKey: ['agent', 'scanner-coverage-detail'],
    queryFn: () => fetchScannerCoverage(30),
    staleTime: 60_000,
  });

  return (
    <DrawerShell title="Scanner Coverage" onClose={onClose}>
      <div className="space-y-4">
        {(coverage?.per_scanner || []).map((scanner) => (
          <div key={scanner.name} className="flex items-center justify-between py-2 border-b border-slate-800">
            <div>
              <div className="text-sm text-slate-200">{scanner.name.replace(/^scan_/, '').replace(/_/g, ' ')}</div>
              {scanner.finding_count > 0 && (
                <div className="text-xs text-slate-500">
                  Found {scanner.finding_count} issues ({scanner.actionable_count} actionable)
                  {scanner.noise_pct > 0 && ` \u00B7 ${scanner.noise_pct}% noise`}
                </div>
              )}
              {scanner.finding_count === 0 && (
                <div className="text-xs text-slate-600">No findings yet</div>
              )}
            </div>
            <div className={cn('w-2 h-2 rounded-full', scanner.enabled ? 'bg-emerald-400' : 'bg-slate-600')} />
          </div>
        ))}
        {(!coverage?.per_scanner || coverage.per_scanner.length === 0) && (
          <div className="text-sm text-slate-500">No scanner data available</div>
        )}
      </div>
    </DrawerShell>
  );
}

function DrawerShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-2xl bg-slate-950 border-l border-slate-800 h-full overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
