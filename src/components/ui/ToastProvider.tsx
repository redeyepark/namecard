'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Toast, type ToastData, type ToastVariant } from './Toast';

// Auto-dismiss duration in milliseconds
const TOAST_DURATION = 3000;

// Maximum number of visible toasts
const MAX_TOASTS = 5;

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to access the toast notification system.
 * Must be used within a ToastProvider.
 */
export function useToast(): ToastContextValue['toast'] {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}

let toastIdCounter = 0;

function generateToastId(): string {
  toastIdCounter += 1;
  return `toast-${toastIdCounter}-${Date.now()}`;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [mounted, setMounted] = useState(false);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Ensure portal only renders on the client
  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- Required pattern for SSR-safe portal rendering
    const timers = timersRef.current;
    return () => {
      // Clear all timers on unmount
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = generateToastId();
      const newToast: ToastData = { id, message, variant };

      setToasts((prev) => {
        // Trim oldest toasts if exceeding maximum
        const updated = [...prev, newToast];
        if (updated.length > MAX_TOASTS) {
          const removed = updated.slice(0, updated.length - MAX_TOASTS);
          removed.forEach((t) => {
            const timer = timersRef.current.get(t.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(t.id);
            }
          });
          return updated.slice(-MAX_TOASTS);
        }
        return updated;
      });

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        removeToast(id);
      }, TOAST_DURATION);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success: (message: string) => addToast(message, 'success'),
      error: (message: string) => addToast(message, 'error'),
      info: (message: string) => addToast(message, 'info'),
    }),
    [addToast]
  );

  const contextValue = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-label="알림 메시지"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col-reverse gap-2 items-center pointer-events-none w-full max-w-sm px-4"
          >
            {toasts.map((t) => (
              <div key={t.id} className="pointer-events-auto w-full">
                <Toast toast={t} onClose={removeToast} />
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
