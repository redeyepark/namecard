'use client';

import { forwardRef, useId } from 'react';

type SelectVariant = 'default' | 'error';
type SelectSize = 'sm' | 'md' | 'lg';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: SelectVariant;
  selectSize?: SelectSize;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  options?: SelectOption[];
  placeholder?: string;
}

const VARIANT_STYLES: Record<SelectVariant, string> = {
  default: 'bg-surface border border-border-medium text-primary',
  error: 'bg-surface border border-error text-error',
};

const SIZE_STYLES: Record<SelectSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2 text-base',
  lg: 'px-4 py-2.5 text-lg',
};

// Inline chevron-down SVG
function ChevronDown() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      variant = 'default',
      selectSize = 'md',
      label,
      helperText,
      errorMessage,
      options,
      placeholder,
      className = '',
      id: externalId,
      children,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = externalId || generatedId;
    const helperId = `${selectId}-helper`;
    const errorId = `${selectId}-error`;

    const resolvedVariant = errorMessage ? 'error' : variant;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-primary mb-1 block"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={resolvedVariant === 'error' ? true : undefined}
            aria-describedby={
              errorMessage ? errorId : helperText ? helperId : undefined
            }
            className={`
              appearance-none rounded-radius-md transition-colors w-full pr-10
              placeholder:text-text-tertiary
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-primary
              ${VARIANT_STYLES[resolvedVariant]}
              ${SIZE_STYLES[selectSize]}
              ${className}
            `}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown />
        </div>
        {errorMessage && (
          <p id={errorId} className="text-sm text-error mt-1" role="alert">
            {errorMessage}
          </p>
        )}
        {!errorMessage && helperText && (
          <p id={helperId} className="text-sm text-text-secondary mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
