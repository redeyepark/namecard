'use client';

import { HashtagEditor } from '@/components/editor/HashtagEditor';
import { SocialLinkEditor } from '@/components/editor/SocialLinkEditor';

export function SocialTagStep() {
  return (
    <section aria-label="Social links and hashtags">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">소셜 및 태그</h2>

      <div className="space-y-6">
        {/* Hashtags section */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">해시태그</h3>
          <HashtagEditor />
        </div>

        {/* Social links section */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">소셜 링크</h3>
          <SocialLinkEditor />
        </div>
      </div>
    </section>
  );
}
