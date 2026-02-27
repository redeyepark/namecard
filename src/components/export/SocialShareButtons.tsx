'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { copyTextToClipboard } from '@/lib/share-utils';
import {
  shareFacebook,
  shareTwitter,
  shareLinkedIn,
  shareLine,
} from '@/lib/social-share';

interface SocialShareButtonsProps {
  url: string;
  title: string;
  disabled?: boolean;
}

interface PlatformConfig {
  name: string;
  ariaLabel: string;
  color: string;
  hoverColor: string;
  icon: React.ReactNode;
  action: () => void;
}

/**
 * Grid of social platform share buttons.
 * Includes Facebook, X/Twitter, LinkedIn, LINE, and a link copy button.
 */
export function SocialShareButtons({
  url,
  title,
  disabled = false,
}: SocialShareButtonsProps) {
  const toast = useToast();

  const handleCopyLink = useCallback(async () => {
    const success = await copyTextToClipboard(url);
    if (success) {
      toast.success('링크가 클립보드에 복사되었습니다.');
    } else {
      toast.error('링크 복사에 실패했습니다.');
    }
  }, [url, toast]);

  const platforms: PlatformConfig[] = [
    {
      name: 'Facebook',
      ariaLabel: 'Facebook으로 공유',
      color: 'bg-[#1877F2]',
      hoverColor: 'hover:bg-[#1466D8]',
      icon: (
        // Facebook "f" icon
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M18 10a8 8 0 1 0-9.25 7.9v-5.59H6.72V10h2.03V8.16c0-2 1.2-3.11 3.02-3.11.88 0 1.79.16 1.79.16v1.97h-1.01c-.99 0-1.3.62-1.3 1.25V10h2.22l-.36 2.31h-1.86v5.6A8 8 0 0 0 18 10Z"
            fill="currentColor"
          />
        </svg>
      ),
      action: () => shareFacebook(url),
    },
    {
      name: 'X',
      ariaLabel: 'X(Twitter)로 공유',
      color: 'bg-black',
      hoverColor: 'hover:bg-gray-800',
      icon: (
        // X (Twitter) logo
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M13.9 2h2.58L11.1 8.16 17.3 16h-4.88l-3.87-5.06L4.32 16H1.73l5.72-6.54L1.5 2h5l3.5 4.63L13.9 2Zm-.91 12.58h1.43L5.87 3.48H4.34l8.65 11.1Z"
            fill="currentColor"
          />
        </svg>
      ),
      action: () => shareTwitter(url, title),
    },
    {
      name: 'LinkedIn',
      ariaLabel: 'LinkedIn으로 공유',
      color: 'bg-[#0A66C2]',
      hoverColor: 'hover:bg-[#094FA0]',
      icon: (
        // LinkedIn "in" icon
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M5.78 7.56H3.06v9.38h2.72V7.56ZM4.42 6.38c.87 0 1.58-.71 1.58-1.59a1.58 1.58 0 1 0-3.16 0c0 .88.7 1.59 1.58 1.59ZM17.06 11.76c0-2.83-1.72-4.2-3.65-4.2-1.47 0-2.28.79-2.7 1.4V7.56H8v9.38h2.72v-5.06c0-.25.02-.5.1-.68.2-.5.67-1.02 1.46-1.02 1.03 0 1.44.78 1.44 1.93v4.83h2.72v-5.18h.62Z"
            fill="currentColor"
          />
        </svg>
      ),
      action: () => shareLinkedIn(url, title),
    },
    {
      name: 'LINE',
      ariaLabel: 'LINE으로 공유',
      color: 'bg-[#06C755]',
      hoverColor: 'hover:bg-[#05A847]',
      icon: (
        // LINE speech bubble icon
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M17.5 8.82c0-3.77-3.78-6.82-8.42-6.82C4.44 2 .66 5.05.66 8.82c0 3.37 2.99 6.2 7.03 6.73.27.06.64.18.74.41.08.21.06.54.03.75l-.12.72c-.04.21-.17.84.73.46.9-.39 4.87-2.87 6.65-4.91 1.22-1.34 1.88-2.87 1.88-4.16ZM5.96 10.8h-2a.47.47 0 0 1-.47-.47V7.15c0-.26.21-.47.47-.47s.47.21.47.47v2.71h1.53c.26 0 .47.21.47.47s-.21.47-.47.47Zm1.7-.47a.47.47 0 0 1-.94 0V7.15a.47.47 0 0 1 .94 0v3.18Zm4.14 0c0 .2-.12.37-.3.44a.47.47 0 0 1-.52-.1L9.33 8.65v1.68a.47.47 0 0 1-.94 0V7.15c0-.2.12-.37.3-.44a.47.47 0 0 1 .52.1l1.65 2.02V7.15a.47.47 0 0 1 .94 0v3.18Zm2.82-2.71a.47.47 0 0 1 0 .94h-1.53v.59h1.53a.47.47 0 0 1 0 .94h-2a.47.47 0 0 1-.47-.47v-3.1l-.01-.06v-.02c.02-.25.22-.45.48-.45h2c.26 0 .47.21.47.47s-.21.47-.47.47h-1.53v.59h1.53v.1Z"
            fill="currentColor"
          />
        </svg>
      ),
      action: () => shareLine(url),
    },
    {
      name: '링크 복사',
      ariaLabel: '링크 복사',
      color: 'bg-gray-600',
      hoverColor: 'hover:bg-gray-500',
      icon: (
        // Chain link icon
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M8.59 13.41a1.5 1.5 0 0 1 0-2.12l4.24-4.24a3.5 3.5 0 0 1 4.95 4.95l-1.42 1.41a1 1 0 0 1-1.41-1.41l1.41-1.42a1.5 1.5 0 0 0-2.12-2.12L10 12.7a1.5 1.5 0 0 1-1.41.71ZM11.41 6.59a1.5 1.5 0 0 1 0 2.12L7.17 12.95a3.5 3.5 0 1 1-4.95-4.95l1.42-1.41a1 1 0 0 1 1.41 1.41L3.64 9.42a1.5 1.5 0 1 0 2.12 2.12L10 7.3a1.5 1.5 0 0 1 1.41-.71Z"
            fill="currentColor"
          />
        </svg>
      ),
      action: handleCopyLink,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {platforms.map((platform) => (
        <button
          key={platform.name}
          type="button"
          onClick={platform.action}
          disabled={disabled}
          aria-label={platform.ariaLabel}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-none px-2 py-3 text-white transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020912] disabled:pointer-events-none disabled:opacity-50 min-h-[44px] ${platform.color} ${platform.hoverColor}`}
        >
          {platform.icon}
          <span className="text-xs font-medium">{platform.name}</span>
        </button>
      ))}
    </div>
  );
}
