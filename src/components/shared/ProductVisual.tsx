'use client';

import { useState } from 'react';

type ProductVisualProps = {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  labelClassName?: string;
};

export default function ProductVisual({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  labelClassName = '',
}: ProductVisualProps) {
  const [hasError, setHasError] = useState(false);
  const canRenderImage = Boolean(src) && !hasError;

  if (!canRenderImage) {
    return (
      <div
        className={`flex items-center justify-center bg-[linear-gradient(135deg,#fff2e6,#ffffff,#ffe3ca)] ${fallbackClassName}`}
      >
        <span className={`px-4 text-center text-sm font-semibold text-slate-500 ${labelClassName}`}>
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
