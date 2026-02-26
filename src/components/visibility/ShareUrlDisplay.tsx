'use client';

import { useState, useCallback } from 'react';

interface ShareUrlDisplayProps {
  url: string;
  isVisible: boolean;
}

/**
 * Displays a shareable public card URL with a clipboard copy button.
 * Shows a check icon for 2 seconds after successful copy.
 */
export function ShareUrlDisplay({ url, isVisible }: ShareUrlDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        type="text"
        readOnly
        value={url}
        className="flex-1 text-xs text-[#020912]/70 bg-gray-50 border border-[rgba(2,9,18,0.15)] px-3 py-1.5 rounded select-all focus:outline-none"
        onClick={(e) => (e.target as HTMLInputElement).select()}
      />
      <button
        type="button"
        onClick={handleCopy}
        className="flex-shrink-0 p-1.5 text-[#020912]/60 hover:text-[#020912] border border-[rgba(2,9,18,0.15)] rounded hover:bg-gray-50 transition-colors"
        aria-label="URL 복사"
        title="URL 복사"
      >
        {copied ? (
          <svg
            className="w-4 h-4 text-[#2d8c3c]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
