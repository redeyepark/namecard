'use client';

import { useEffect, useRef } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

// SVG icons rendered inline to avoid external dependencies
function SuccessIcon() {
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
        d="M10 18a8 8 0 100-16 8 8 0 000 16z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M7 10l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorIcon() {
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
        d="M10 18a8 8 0 100-16 8 8 0 000 16z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M12.5 7.5l-5 5M7.5 7.5l5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoIcon() {
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
        d="M10 18a8 8 0 100-16 8 8 0 000 16z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M10 9v4M10 7h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 4L4 12M4 4l8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'bg-green-50 border-green-300 text-green-900',
  error: 'bg-red-50 border-red-300 text-red-900',
  info: 'bg-blue-50 border-blue-300 text-blue-900',
};

const VARIANT_ICON_STYLES: Record<ToastVariant, string> = {
  success: 'text-green-600',
  error: 'text-red-600',
  info: 'text-blue-600',
};

const VARIANT_ICONS: Record<ToastVariant, () => React.JSX.Element> = {
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

export function Toast({ toast, onClose }: ToastProps) {
  const toastRef = useRef<HTMLDivElement>(null);
  const Icon = VARIANT_ICONS[toast.variant];

  useEffect(() => {
    // Focus management: announce to screen readers
    const el = toastRef.current;
    if (el) {
      el.focus();
    }
  }, []);

  return (
    <div
      ref={toastRef}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={-1}
      className={`
        flex items-center gap-3 min-h-[44px] px-4 py-3 border shadow-lg
        rounded-none w-full max-w-sm
        toast-slide-up
        ${VARIANT_STYLES[toast.variant]}
      `}
    >
      <span className={`shrink-0 ${VARIANT_ICON_STYLES[toast.variant]}`}>
        <Icon />
      </span>

      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>

      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className={`
          shrink-0 p-1 rounded-none opacity-60 hover:opacity-100
          transition-opacity min-h-[28px] min-w-[28px]
          flex items-center justify-center
        `}
        aria-label="닫기"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
