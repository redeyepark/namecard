'use client';

import { useCardData } from './CardDataProvider';

/**
 * NametagCardFront - Corporate name tag style front layout.
 * Full-bleed character illustration covering the entire card with no text overlay.
 * Uses a different aspect ratio (197:354) matching real corporate name tag dimensions.
 * Uses inline styles for all critical visual properties (html-to-image compatibility).
 */
export function NametagCardFront() {
  const { front } = useCardData();

  return (
    <div
      id="card-front"
      className="relative w-full aspect-[197/354] overflow-hidden"
      style={{
        backgroundColor: front.backgroundColor,
        fontFamily: "'Nanum Myeongjo', serif",
      }}
    >
      {/* Full-bleed illustration - no text overlay */}
      {front.avatarImage ? (
        <img
          src={front.avatarImage}
          alt="Illustration"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <span
            style={{
              color: 'rgba(0, 0, 0, 0.3)',
              fontSize: '14px',
              fontFamily: "'Nanum Myeongjo', serif",
            }}
          >
            Upload Image
          </span>
        </div>
      )}
    </div>
  );
}
