'use client';

import { useState } from 'react';
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

interface SocialLinksEditorProps {
  socialLinks: SocialLink[];
  onSave: (links: SocialLink[]) => void;
}

/**
 * Platform configuration with labels and icons.
 */
const platforms: {
  platform: SocialPlatform;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
}[] = [
  { platform: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
  { platform: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/username' },
  { platform: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/username' },
  { platform: 'twitter', label: 'Twitter', icon: Twitter, placeholder: 'https://twitter.com/username' },
  { platform: 'github', label: 'GitHub', icon: Github, placeholder: 'https://github.com/username' },
  { platform: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@channel' },
  { platform: 'website', label: 'Website', icon: Globe, placeholder: 'https://example.com' },
  { platform: 'email', label: 'Email', icon: Mail, placeholder: 'name@example.com' },
];

/**
 * Social links editor for the profile owner.
 * Lists supported platforms with URL inputs and a save button.
 */
export function SocialLinksEditor({ socialLinks, onSave }: SocialLinksEditorProps) {
  // Initialize state from existing social links
  const initialValues = platforms.reduce<Record<SocialPlatform, string>>(
    (acc, { platform }) => {
      const existing = socialLinks.find((link) => link.platform === platform);
      acc[platform] = existing?.url ?? '';
      return acc;
    },
    {} as Record<SocialPlatform, string>
  );

  const [values, setValues] = useState(initialValues);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (platform: SocialPlatform, url: string) => {
    setValues((prev) => ({ ...prev, [platform]: url }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Filter out empty values and build SocialLink array
      const links: SocialLink[] = platforms
        .filter(({ platform }) => values[platform].trim() !== '')
        .map(({ platform }) => ({
          platform,
          url: values[platform].trim(),
        }));
      onSave(links);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      <h3 className="font-[family-name:var(--font-heading),sans-serif] text-sm font-medium text-[var(--color-text-primary)] mb-4">
        소셜 링크
      </h3>

      <div className="flex flex-col gap-3">
        {platforms.map(({ platform, label, icon: Icon, placeholder }) => (
          <div key={platform} className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-24 flex-shrink-0">
              <Icon className="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
              <span className="text-xs text-[var(--color-text-secondary)]">
                {label}
              </span>
            </div>
            <input
              type={platform === 'email' ? 'email' : 'url'}
              value={values[platform]}
              onChange={(e) => handleChange(platform, e.target.value)}
              placeholder={placeholder}
              className="flex-1 h-9 px-3 border border-[var(--color-divider)] bg-[var(--color-bg)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              aria-label={`${label} URL`}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-4 h-10 px-6 text-sm font-medium text-[var(--color-secondary)] bg-[var(--color-primary)] hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSaving ? '저장 중...' : '소셜 링크 저장'}
      </button>
    </div>
  );
}
