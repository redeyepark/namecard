'use client';

import { forwardRef, useState } from 'react';

type AvatarVariant = 'circle' | 'rounded';
type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  variant?: AvatarVariant;
  size?: AvatarSize;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
};

const VARIANT_CLASSES: Record<AvatarVariant, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-radius-md',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = '',
      fallback,
      variant = 'circle',
      size = 'md',
      className = '',
      ...rest
    },
    ref,
  ) => {
    const [imgError, setImgError] = useState(false);
    const showImage = src && !imgError;

    return (
      <div
        ref={ref}
        className={`
          relative inline-flex items-center justify-center
          overflow-hidden bg-bg text-text-secondary font-medium
          ${SIZE_CLASSES[size]}
          ${VARIANT_CLASSES[variant]}
          ${className}
        `}
        {...rest}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden={!!alt ? undefined : 'true'}>
            {fallback || alt?.charAt(0)?.toUpperCase() || '?'}
          </span>
        )}
      </div>
    );
  },
);

Avatar.displayName = 'Avatar';
