'use client';

import { useState, useEffect, useRef } from 'react';
import { getPhoneTelURI, generateQRDataURL } from '@/lib/qrcode';
import { useCardData } from './CardDataProvider';

/**
 * NametagCardBack - Corporate name tag style back layout.
 * White background with QR code in top portion, Korean name with wide letter-spacing,
 * English name below, and instruction text near the bottom.
 * Uses absolute positioning to match AEC reference image proportions exactly.
 * Aspect ratio: 197:354 matching real corporate name tag dimensions.
 * Uses inline styles for all critical visual properties (html-to-image compatibility).
 *
 * Font sizes are calculated dynamically via ResizeObserver as proportions of
 * container width, matching the AEC reference image (591x1062px).
 * This avoids cqi units which are incompatible with html-to-image.
 */
export function NametagCardBack() {
  const card = useCardData();
  const { front, back } = card;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Track container width for responsive font sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Generate QR code from phone tel: URI for direct calling
  useEffect(() => {
    const telUri = getPhoneTelURI(card);
    if (telUri) {
      generateQRDataURL(telUri, 256)
        .then((dataUrl) => setQrDataUrl(dataUrl))
        .catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [card]);

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
  // Based on AEC reference: 591px width -> Korean 65px, English 36px, Instruction 19px
  const koreanNameSize = Math.max(16, Math.round(containerWidth * 0.11));
  const englishNameSize = Math.max(10, Math.round(containerWidth * 0.061));
  const instructionSize = Math.max(7, Math.round(containerWidth * 0.032));

  return (
    <div
      ref={containerRef}
      id="card-back"
      className="relative w-full aspect-[197/354] overflow-hidden"
      style={{
        backgroundColor: '#FFFFFF',
        fontFamily: "'Nanum Myeongjo', serif",
        position: 'relative',
      }}
    >
      {/* QR Code - top 17.4%, height 31.5%, width 56.7%, centered horizontally */}
      <div
        style={{
          position: 'absolute',
          top: '17%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '57%',
          height: '32%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR Code"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              imageRendering: 'pixelated',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              backgroundColor: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
          >
            <span
              style={{
                color: '#9CA3AF',
                fontSize: '12px',
                fontFamily: "'Nanum Myeongjo', serif",
              }}
            >
              QR Code
            </span>
          </div>
        )}
      </div>

      {/* Korean name - positioned at ~59.3% from top, large bold text with wide letter-spacing */}
      <div
        style={{
          position: 'absolute',
          top: '59.3%',
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: 'translateY(-50%)',
        }}
      >
        <h2
          style={{
            fontSize: `${koreanNameSize}px`,
            fontWeight: 'bold',
            color: '#020912',
            fontFamily: "'Nanum Myeongjo', serif",
            letterSpacing: '0.45em',
            margin: 0,
            lineHeight: 1.2,
            paddingLeft: '0.45em',
          }}
        >
          {back.fullName || 'FULL NAME'}
        </h2>
      </div>

      {/* English name - positioned at ~68.7% from top, medium text */}
      <div
        style={{
          position: 'absolute',
          top: '68.7%',
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: 'translateY(-50%)',
        }}
      >
        <p
          style={{
            fontSize: `${englishNameSize}px`,
            color: '#374151',
            fontFamily: "'Nanum Myeongjo', serif",
            margin: 0,
            lineHeight: 1.4,
            letterSpacing: '0.08em',
          }}
        >
          {front.displayName || 'YOUR NAME'}
        </p>
      </div>

      {/* Instruction text - positioned at ~87.6% from top, two lines */}
      <div
        style={{
          position: 'absolute',
          top: '87.6%',
          left: '8%',
          right: '8%',
          textAlign: 'center',
          transform: 'translateY(-50%)',
        }}
      >
        <p
          style={{
            fontSize: `${instructionSize}px`,
            color: '#9CA3AF',
            fontFamily: "'Nanum Myeongjo', serif",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {'전화 연결이 필요하시면 QR코드를'}
          <br />
          {'카메라로 스캔해주세요.'}
        </p>
      </div>
    </div>
  );
}
