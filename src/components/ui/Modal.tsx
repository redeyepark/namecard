'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

type ModalVariant = 'default' | 'fullscreen';
type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  variant?: ModalVariant;
}

const SIZE_STYLES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

// Inline close icon
function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15 5L5 15M5 5l10 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Client-side mount check for createPortal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Animate open/close
  useEffect(() => {
    if (open) {
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => {
        setVisible(true);
      });
    } else {
      setVisible(false);
    }
  }, [open]);

  // Focus trap and body scroll lock
  useEffect(() => {
    if (!open) return;

    // Save previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the modal content
    const timer = setTimeout(() => {
      contentRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      // Restore focus
      previousFocusRef.current?.focus();
    };
  }, [open]);

  // ESC key handler
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap: Tab cycling
      if (e.key === 'Tab' && contentRef.current) {
        const focusableElements = contentRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  if (!mounted || !open) return null;

  const isFullscreen = variant === 'fullscreen';

  const modalContent = (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`
        fixed inset-0 z-50
        flex items-center justify-center
        transition-opacity duration-200
        ${visible ? 'opacity-100' : 'opacity-0'}
        ${isFullscreen ? '' : 'bg-black/50 backdrop-blur-sm p-4'}
      `}
      role="presentation"
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || undefined}
        tabIndex={-1}
        className={`
          bg-surface rounded-radius-lg shadow-lg
          transition-all duration-200
          focus-visible:outline-none
          ${visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          ${
            isFullscreen
              ? 'fixed inset-0 rounded-none'
              : `w-full ${SIZE_STYLES[size]}`
          }
        `}
      >
        {/* Header */}
        {(title || !isFullscreen) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
            {title && (
              <h2 className="text-lg font-medium text-primary">{title}</h2>
            )}
            <button
              type="button"
              onClick={onClose}
              className="
                ml-auto p-1.5 rounded-radius-sm
                text-text-secondary hover:text-primary hover:bg-bg
                transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
              "
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={`px-6 py-4 ${isFullscreen ? 'overflow-y-auto h-full' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
