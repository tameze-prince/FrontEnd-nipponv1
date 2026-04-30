'use client';

import { toast as sonnerToast } from 'sonner';

type ToastInput = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  return {
    toast({ title, description, variant }: ToastInput) {
      const message = title || description || '';
      const options = description && title ? { description } : undefined;

      if (variant === 'destructive') {
        sonnerToast.error(message, options);
      } else {
        sonnerToast.success(message, options);
      }
    },
  };
}
