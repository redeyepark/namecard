'use client';

import { forwardRef, useId, useEffect, useRef, useCallback } from 'react';

type TextareaVariant = 'default' | 'error';
type TextareaSize = 'sm' | 'md' | 'lg';

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: TextareaVariant;
  textareaSize?: TextareaSize;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  autoResize?: boolean;
}

const VARIANT_STYLES: Record<TextareaVariant, string> = {
  default: 'bg-surface border border-border-medium text-primary',
  error: 'bg-surface border border-error text-error',
};

const SIZE_STYLES: Record<TextareaSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2 text-base',
  lg: 'px-4 py-2.5 text-lg',
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant = 'default',
      textareaSize = 'md',
      label,
      helperText,
      errorMessage,
      autoResize = false,
      className = '',
      id: externalId,
      onChange,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = externalId || generatedId;
    const helperId = `${textareaId}-helper`;
    const errorId = `${textareaId}-error`;
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const resolvedVariant = errorMessage ? 'error' : variant;

    const adjustHeight = useCallback(() => {
      const el = internalRef.current;
      if (el && autoResize) {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
    }, [autoResize]);

    useEffect(() => {
      adjustHeight();
    }, [adjustHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      adjustHeight();
    };

    // Merge refs
    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
            node;
        }
      },
      [ref],
    );

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-primary mb-1 block"
          >
            {label}
          </label>
        )}
        <textarea
          ref={setRefs}
          id={textareaId}
          aria-invalid={resolvedVariant === 'error' ? true : undefined}
          aria-describedby={
            errorMessage ? errorId : helperText ? helperId : undefined
          }
          onChange={handleChange}
          className={`
            rounded-radius-md transition-colors w-full
            placeholder:text-text-tertiary
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-primary
            ${autoResize ? 'resize-none overflow-hidden' : ''}
            ${VARIANT_STYLES[resolvedVariant]}
            ${SIZE_STYLES[textareaSize]}
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

Textarea.displayName = 'Textarea';
