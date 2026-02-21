'use client';

import { useCardStore } from '@/stores/useCardStore';
import { ImageUploader } from '@/components/editor/ImageUploader';
import { ColorPicker } from '@/components/editor/ColorPicker';

export function PhotoUploadStep() {
  const card = useCardStore((state) => state.card);
  const updateFront = useCardStore((state) => state.updateFront);
  const updateBack = useCardStore((state) => state.updateBack);

  return (
    <section aria-label="Photo and color settings">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">사진 및 색상</h2>

      <div className="space-y-6">
        {/* Avatar image upload */}
        <div>
          <ImageUploader />
        </div>

        {/* Front background color */}
        <div>
          <ColorPicker
            color={card.front.backgroundColor}
            onChange={(c) => updateFront({ backgroundColor: c })}
            label="앞면 배경색"
          />
        </div>

        {/* Back background color */}
        <div>
          <ColorPicker
            color={card.back.backgroundColor}
            onChange={(c) => updateBack({ backgroundColor: c })}
            label="뒷면 배경색"
          />
        </div>
      </div>
    </section>
  );
}
