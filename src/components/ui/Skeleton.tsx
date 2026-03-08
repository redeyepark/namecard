'use client';

type SkeletonVariant = 'text' | 'circle' | 'rect';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
}

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded-radius-sm',
  circle: 'rounded-full',
  rect: 'rounded-radius-md',
};

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...rest
}: SkeletonProps) {
  const dimensionStyle: React.CSSProperties = {
    ...style,
    ...(width != null ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height != null ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    // For circle variant, ensure equal dimensions
    ...(variant === 'circle' && width != null && height == null
      ? { height: typeof width === 'number' ? `${width}px` : width }
      : {}),
  };

  return (
    <div
      aria-hidden="true"
      className={`
        animate-pulse bg-border-light
        ${VARIANT_CLASSES[variant]}
        ${className}
      `}
      style={dimensionStyle}
      {...rest}
    />
  );
}
