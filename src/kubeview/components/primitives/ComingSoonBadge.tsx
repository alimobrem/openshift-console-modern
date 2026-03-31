import { cn } from '@/lib/utils';

interface ComingSoonBadgeProps {
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function ComingSoonBadge({
  label = 'Coming Soon',
  size = 'sm',
  className,
}: ComingSoonBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        'bg-violet-500/10 text-violet-400 border border-violet-500/20',
        sizeClasses[size],
        className
      )}
    >
      {label}
    </span>
  );
}
