'use client';

import { useCardStore } from '@/stores/useCardStore';
import { ColorPicker } from './ColorPicker';
import { TextColorPicker } from './TextColorPicker';
import { HashtagEditor } from './HashtagEditor';
import { SocialLinkEditor } from './SocialLinkEditor';

export function BackEditor() {
  const back = useCardStore((state) => state.card.back);
  const updateBack = useCardStore((state) => state.updateBack);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          value={back.fullName}
          onChange={(e) => updateBack({ fullName: e.target.value })}
          placeholder="WONJOON CHOI"
          maxLength={50}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
        />
      </div>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title / Role
        </label>
        <input
          id="title"
          type="text"
          value={back.title}
          onChange={(e) => updateBack({ title: e.target.value })}
          placeholder="Fandom Author &amp; Marketing Consultant"
          maxLength={80}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
        />
      </div>
      <HashtagEditor />
      <SocialLinkEditor />
      <ColorPicker
        color={back.backgroundColor}
        onChange={(color) => updateBack({ backgroundColor: color })}
        label="Background Color"
      />
      <TextColorPicker
        color={back.textColor || '#000000'}
        onChange={(color) => updateBack({ textColor: color })}
      />
    </div>
  );
}
