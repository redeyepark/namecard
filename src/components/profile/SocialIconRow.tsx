'use client';

import {
  Instagram,
  Facebook,
  Linkedin,
  Mail,
  Globe,
  Github,
  Youtube,
  Twitter,
} from 'lucide-react';
import type { SocialLink, SocialPlatform } from '@/types/profile';

interface SocialIconRowProps {
  socialLinks: SocialLink[];
}

/**
 * Map SocialPlatform to lucide-react icon components.
 */
const platformIcons: Record<SocialPlatform, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  email: Mail,
  website: Globe,
  github: Github,
  youtube: Youtube,
  twitter: Twitter,
};

/**
 * Horizontal row of social media icon links.
 * Each icon opens the corresponding URL in a new tab.
 */
export function SocialIconRow({ socialLinks }: SocialIconRowProps) {
  if (!socialLinks || socialLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-4">
      {socialLinks.map((link) => {
        const Icon = platformIcons[link.platform];
        if (!Icon) return null;

        const href =
          link.platform === 'email'
            ? link.url.startsWith('mailto:')
              ? link.url
              : `mailto:${link.url}`
            : link.url;

        return (
          <a
            key={link.platform}
            href={href}
            target={link.platform === 'email' ? undefined : '_blank'}
            rel={link.platform === 'email' ? undefined : 'noopener noreferrer'}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label={link.platform}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
          </a>
        );
      })}
    </div>
  );
}
