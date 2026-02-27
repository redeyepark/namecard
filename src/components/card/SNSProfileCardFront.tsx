'use client';

import { useState, useEffect, useRef } from 'react';
import { useCardData } from './CardDataProvider';

/**
 * SNSProfileCardFront - SNS profile picture style front layout.
 * Square (1:1) card with a large centered circular profile image
 * on a solid background, with the display name below.
 * Designed for social media profile pictures (Instagram, LinkedIn, KakaoTalk, etc).
 * Uses inline styles for all critical visual properties (html-to-image compatibility).
 *
 * Font sizes are calculated dynamically via ResizeObserver as proportions of
 * container width. This avoids cqi units which are incompatible with html-to-image.
 */
export function SNSProfileCardFront() {
  const card = useCardData();
  const { front } = card;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // ResizeObserver to track container width for dynamic font sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Calculate sizes as proportions of container width
  const circleSize = Math.max(80, Math.round(containerWidth * 0.65));
  const nameSize = Math.max(14, Math.round(containerWidth * 0.07));
  const initialsSize = Math.max(20, Math.round(containerWidth * 0.18));

  const bgColor = front.backgroundColor || '#020912';
  const txtColor = front.textColor || '#fcfcfc';

  // Extract initials from display name for placeholder
  const displayName = front.displayName || 'YOUR NAME';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      ref={containerRef}
      id="card-front"
      className="relative w-full aspect-square overflow-hidden"
      style={{
        backgroundColor: bgColor,
        fontFamily: "'Figtree', sans-serif",
      }}
    >
      {/* Centered circular profile image */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${circleSize}px`,
          height: `${circleSize}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: front.avatarImage ? 'transparent' : `${txtColor}15`,
          border: front.avatarImage ? 'none' : `2px solid ${txtColor}20`,
        }}
      >
        {front.avatarImage ? (
          <img
            src={front.avatarImage}
            alt="Profile"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: `${initialsSize}px`,
              fontWeight: 700,
              color: `${txtColor}60`,
              fontFamily: "'Figtree', sans-serif",
              letterSpacing: '0.05em',
              userSelect: 'none',
            }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Display name below the circle */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '8%',
          right: '8%',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: `${nameSize}px`,
            fontWeight: 700,
            color: txtColor,
            fontFamily: "'Figtree', sans-serif",
            margin: 0,
            lineHeight: 1.3,
            letterSpacing: '0.02em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </h1>
      </div>
    </div>
  );
}
