'use client';

import { useEffect, useRef } from 'react';

interface ExportBottomSheetProps {
  children: React.ReactNode;
  onClose: () => void;
}

/**
 * Mobile bottom sheet that slides up from the bottom of the viewport.
 * Includes a semi-transparent backdrop and a visual drag handle.
 */
export function ExportBottomSheet({ children, onClose }: ExportBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on ESC key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Focus the sheet on mount
  useEffect(() => {
    sheetRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end" aria-label="내보내기 및 공유">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="내보내기 및 공유 메뉴"
        tabIndex={-1}
        className="
          relative w-full bg-white
          max-h-[80vh] overflow-y-auto
          animate-slide-up
        "
      >
        {/* Drag handle (visual only) */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {children}
      </div>
    </div>
  );
}
