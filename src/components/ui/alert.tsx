import * as React from 'react';

import { cn } from '@/lib/utils';

export function Alert({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' }) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border p-4 text-sm',
        variant === 'destructive'
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-slate-200 bg-white text-slate-800',
        className
      )}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('leading-6', className)} {...props} />;
}
