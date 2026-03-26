import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  /** Apply a color variant to the value */
  variant?: 'default' | 'success' | 'warning' | 'error';
  /** Highlight the card border when truthy */
  highlight?: boolean;
  className?: string;
}

const variantColors = {
  default: 'text-slate-100',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error: 'text-red-400',
};

const highlightBorders = {
  default: '',
  success: 'border-emerald-800',
  warning: 'border-amber-800',
  error: 'border-red-800',
};

export function StatCard({ label, value, variant = 'default', highlight, className }: StatCardProps) {
  return (
    <Card className={cn('p-3', highlight && highlightBorders[variant], className)}>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={cn('text-xl font-bold', variantColors[variant])}>{value}</div>
    </Card>
  );
}
