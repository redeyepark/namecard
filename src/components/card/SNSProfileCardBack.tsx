'use client';

import { useState, useEffect, useRef } from 'react';
import { extractHandle } from '@/lib/social-utils';
import { useCardData } from './CardDataProvider';

/**
 * SNSProfileCardBack - SNS profile picture style back layout.
 * Square (1:1) card with full name, title, hashtags, and social links
 * arranged vertically on a clean solid background.
 * Designed for social media profile pictures (Instagram, LinkedIn, KakaoTalk, etc).
 * Uses inline styles for all critical visual properties (html-to-image compatibility).
 *
 * Font sizes are calculated dynamically via ResizeObserver as proportions of
 * container width. This avoids cqi units which are incompatible with html-to-image.
 */
export function SNSProfileCardBack() {
  const card = useCardData();
  const { back } = card;
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

  // Calculate font sizes as proportions of container width
  const fullNameSize = Math.max(16, Math.round(containerWidth * 0.09));
  const titleSize = Math.max(11, Math.round(containerWidth * 0.05));
  const hashtagSize = Math.max(10, Math.round(containerWidth * 0.04));
  const socialSize = Math.max(9, Math.round(containerWidth * 0.035));

  const bgColor = back.backgroundColor || '#FFFFFF';
  const txtColor = back.textColor || '#020912';

  // Sort social links by platform order
  const platformOrder = ['phone', 'youtube', 'facebook', 'instagram', 'linkedin', 'email'];
  const sortedLinks = back.socialLinks
    .filter((link) => link.url || link.label)
    .sort((a, b) => {
      const aIdx = platformOrder.indexOf(a.platform);
      const bIdx = platformOrder.indexOf(b.platform);
      return (aIdx === -1 ? platformOrder.length : aIdx) - (bIdx === -1 ? platformOrder.length : bIdx);
    });

  // Format hashtags as space-separated string
  const hashtagText = back.hashtags
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join('  ');

  return (
    <div
      ref={containerRef}
      id="card-back"
      className="relative w-full aspect-square overflow-hidden"
      style={{
        backgroundColor: bgColor,
        fontFamily: "'Nanum Myeongjo', serif",
      }}
    >
      {/* Full name - top area */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '10%',
          right: '10%',
          textAlign: 'center',
          transform: 'translateY(-50%)',
        }}
      >
        <h2
          style={{
            fontSize: `${fullNameSize}px`,
            fontWeight: 700,
            color: txtColor,
            fontFamily: "'Nanum Myeongjo', serif",
            margin: 0,
            lineHeight: 1.3,
            letterSpacing: '0.08em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {back.fullName || 'FULL NAME'}
        </h2>
      </div>

      {/* Title - below name */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '10%',
          right: '10%',
          textAlign: 'center',
          transform: 'translateY(-50%)',
        }}
      >
        <p
          style={{
            fontSize: `${titleSize}px`,
            color: txtColor,
            opacity: 0.65,
            fontFamily: "'Nanum Myeongjo', serif",
            margin: 0,
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {back.title || 'Your Title'}
        </p>
      </div>

      {/* Hashtags - middle area */}
      {back.hashtags.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '8%',
            right: '8%',
            textAlign: 'center',
            transform: 'translateY(-50%)',
          }}
        >
          <p
            style={{
              fontSize: `${hashtagSize}px`,
              color: txtColor,
              opacity: 0.45,
              fontFamily: "'Nanum Myeongjo', serif",
              margin: 0,
              lineHeight: 1.6,
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
            }}
          >
            {hashtagText}
          </p>
        </div>
      )}

      {/* Social links - bottom area */}
      {sortedLinks.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '70%',
            left: '10%',
            right: '10%',
            textAlign: 'center',
          }}
        >
          {sortedLinks.map((link, i) => (
            <p
              key={i}
              style={{
                fontSize: `${socialSize}px`,
                color: txtColor,
                opacity: 0.5,
                fontFamily: "'Nanum Myeongjo', serif",
                margin: 0,
                lineHeight: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {link.platform} / {extractHandle(link.url || link.label)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
