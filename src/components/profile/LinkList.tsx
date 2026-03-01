'use client';

import type { UserLink } from '@/types/profile';
import { LinkButton } from '@/components/profile/LinkButton';

interface LinkListProps {
  links: UserLink[];
}

/**
 * Vertical stack of link buttons.
 * Renders only active links for public-facing views.
 */
export function LinkList({ links }: LinkListProps) {
  const activeLinks = links.filter((link) => link.isActive);

  if (activeLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 mt-6 w-full">
      {activeLinks.map((link) => (
        <LinkButton key={link.id} link={link} />
      ))}
    </div>
  );
}
