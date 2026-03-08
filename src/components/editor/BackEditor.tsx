'use client';

import { useCardStore } from '@/stores/useCardStore';
import { Input } from '@/components/ui';
import { ColorPicker } from './ColorPicker';
import { TextColorPicker } from './TextColorPicker';
import { HashtagEditor } from './HashtagEditor';
import { SocialLinkEditor } from './SocialLinkEditor';

export function BackEditor() {
  const back = useCardStore((state) => state.card.back);
  const updateBack = useCardStore((state) => state.updateBack);

  return (
    <div className="space-y-4">
      <Input
        id="fullName"
        label="Full Name"
        value={back.fullName}
        onChange={(e) => updateBack({ fullName: e.target.value })}
        placeholder="WONJOON CHOI"
        maxLength={50}
        className="min-h-[44px]"
      />
      <Input
        id="title"
        label="Title / Role"
        value={back.title}
        onChange={(e) => updateBack({ title: e.target.value })}
        placeholder="Fandom Author &amp; Marketing Consultant"
        maxLength={80}
        className="min-h-[44px]"
      />
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
