'use client';

import type { CardData, CardTheme } from '@/types/card';
import { AdminCardPreview } from '@/components/admin/AdminCardPreview';
import { THEME_LIST } from '@/components/admin/ThemeListBox';

interface ThemePreviewPanelProps {
  selectedTheme: CardTheme;
  cardData: CardData;
}

export function ThemePreviewPanel({ selectedTheme, cardData }: ThemePreviewPanelProps) {
  const themeInfo = THEME_LIST.find((t) => t.id === selectedTheme);

  return (
    <div>
      {/* Theme info header */}
      {themeInfo && (
        <div className="mb-4">
          <h3 className="text-base font-semibold text-[#020912]">
            {themeInfo.name}{' '}
            <span className="text-sm font-normal text-[#020912]/50">{themeInfo.nameEn}</span>
          </h3>
          <p className="text-sm text-[#020912]/50 mt-1">{themeInfo.description}</p>
        </div>
      )}

      {/* Card preview - larger size */}
      <div className="max-w-sm mx-auto">
        <AdminCardPreview card={cardData} illustrationUrl={null} />
      </div>
    </div>
  );
}
