'use client';

import { useEffect, useRef } from 'react';

interface ExportDropdownProps {
  children: React.ReactNode;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Desktop dropdown menu positioned below the trigger button.
 * Renders via createPortal in parent, positioned absolutely below the anchor.
 */
export function ExportDropdown({ children, onClose, triggerRef }: ExportDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate position relative to trigger button
  useEffect(() => {
    if (!triggerRef.current || !dropdownRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdown = dropdownRef.current;

    dropdown.style.top = `${rect.bottom + window.scrollY + 4}px`;
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.minWidth = `${Math.max(rect.width, 240)}px`;
  }, [triggerRef]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, triggerRef]);

  // Focus trap: focus the dropdown on mount
  useEffect(() => {
    dropdownRef.current?.focus();
  }, []);

  return (
    <div
      ref={dropdownRef}
      role="menu"
      aria-label="내보내기 및 공유 메뉴"
      tabIndex={-1}
      className="
        absolute z-50
        bg-white border border-gray-200 shadow-lg
        max-h-[70vh] overflow-y-auto
        animate-dropdown-in
      "
      style={{ position: 'absolute' }}
    >
      {children}
    </div>
  );
}
