'use client';

interface ThemeDistributionProps {
  distribution: { theme: string; count: number }[];
}

/**
 * Theme-specific badge colors, mirroring GalleryCardThumbnail themeConfig.
 */
const themeBadgeConfig: Record<string, { bgColor: string; textColor: string; label: string }> = {
  classic: { bgColor: '#020912', textColor: '#fcfcfc', label: 'Classic' },
  pokemon: { bgColor: '#EED171', textColor: '#000000', label: 'Pokemon' },
  hearthstone: { bgColor: '#D4A76A', textColor: '#000000', label: 'Hearthstone' },
  harrypotter: { bgColor: '#C9A84C', textColor: '#000000', label: 'Harry Potter' },
  tarot: { bgColor: '#9B59B6', textColor: '#FFFFFF', label: 'Tarot' },
  nametag: { bgColor: '#374151', textColor: '#FFFFFF', label: 'Nametag' },
  snsprofile: { bgColor: '#020912', textColor: '#fcfcfc', label: 'SNS Profile' },
};

/**
 * Visual display of user's top 3 themes as colored badges.
 * Renders nothing if distribution is empty.
 */
export function ThemeDistribution({ distribution }: ThemeDistributionProps) {
  if (!distribution || distribution.length === 0) {
    return null;
  }

  // Sort by count descending and take top 3
  const top3 = [...distribution]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      {top3.map((item) => {
        const config = themeBadgeConfig[item.theme] ?? {
          bgColor: '#6B7280',
          textColor: '#FFFFFF',
          label: item.theme,
        };

        return (
          <span
            key={item.theme}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: config.bgColor,
              color: config.textColor,
            }}
          >
            {config.label}
            <span
              className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full"
              style={{
                backgroundColor: `${config.textColor}20`,
                color: config.textColor,
              }}
            >
              {item.count}
            </span>
          </span>
        );
      })}
    </div>
  );
}
