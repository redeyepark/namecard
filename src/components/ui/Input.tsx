'use client';

import { forwardRef, useId } from 'react';

type InputVariant = 'default' | 'error';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  inputSize?: InputSize;
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

const VARIANT_STYLES: Record<InputVariant, string> = {
  default: 'bg-surface border border-border-medium text-primary',
  error: 'bg-surface border border-error text-error',
};

const SIZE_STYLES: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2 text-base',
  lg: 'px-4 py-2.5 text-lg',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      inputSize = 'md',
      label,
      helperText,
      errorMessage,
      className = '',
      id: externalId,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = externalId || generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    const resolvedVariant = errorMessage ? 'error' : variant;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-primary mb-1 block"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={resolvedVariant === 'error' ? true : undefined}
          aria-describedby={
            errorMessage ? errorId : helperText ? helperId : undefined
          }
          className={`
            rounded-radius-md transition-colors w-full
            placeholder:text-text-tertiary
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-primary
            ${VARIANT_STYLES[resolvedVariant]}
            ${SIZE_STYLES[inputSize]}
            ${className}
          `}
          {...rest}
        />
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

Input.displayName = 'Input';
