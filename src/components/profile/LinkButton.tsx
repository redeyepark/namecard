'use client';

import { ExternalLink } from 'lucide-react';
import type { UserLink } from '@/types/profile';

interface LinkButtonProps {
  link: UserLink;
}

/**
 * Individual link button that renders as an anchor tag.
 * Full-width, centered text with external link indicator.
 */
export function LinkButton({ link }: LinkButtonProps) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full h-[50px] px-4 border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors text-[var(--color-text-primary)] font-[family-name:var(--font-heading),sans-serif] text-sm font-medium"
      aria-label={link.title}
    >
      <span className="truncate">{link.title}</span>
      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-text-tertiary)]" aria-hidden="true" />
    </a>
  );
}
