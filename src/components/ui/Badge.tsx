'use client';

import { forwardRef } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: 'bg-bg text-primary border border-border-light',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { variant = 'default', size = 'md', className = '', children, ...rest },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center rounded-radius-full font-medium
          ${VARIANT_STYLES[variant]}
          ${SIZE_STYLES[size]}
          ${className}
        `}
        {...rest}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';
