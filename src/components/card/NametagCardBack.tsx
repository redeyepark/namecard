'use client';

import { useState, useEffect } from 'react';
import { useCardStore } from '@/stores/useCardStore';
import { generateVCard, generateQRDataURL } from '@/lib/qrcode';

/**
 * NametagCardBack - Corporate name tag style back layout.
 * White background with QR code in top portion, Korean name with wide letter-spacing,
 * English name below, and instruction text near the bottom.
 * Uses absolute positioning to match AEC reference image proportions exactly.
 * Aspect ratio: 197:354 matching real corporate name tag dimensions.
 * Uses inline styles for all critical visual properties (html-to-image compatibility).
 */
export function NametagCardBack() {
  const card = useCardStore((state) => state.card);
  const { front, back } = card;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Generate QR code from vCard data
  useEffect(() => {
    const vcard = generateVCard(card);
    generateQRDataURL(vcard, 256)
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch(() => setQrDataUrl(null));
  }, [card]);

  return (
    <div
      id="card-back"
      className="relative w-full aspect-[197/354] overflow-hidden"
      style={{
        backgroundColor: '#FFFFFF',
        fontFamily: "'Nanum Myeongjo', serif",
        position: 'relative',
      }}
    >
      {/* QR Code - top 15% to 45% of card height, centered horizontally */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '55%',
          height: '30%',
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

      {/* Korean name - positioned at ~58% from top, large bold text with wide letter-spacing */}
      <div
        style={{
          position: 'absolute',
          top: '58%',
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: 'translateY(-50%)',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(24px, 8cqi, 40px)',
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

      {/* English name - positioned at ~68% from top, medium text */}
      <div
        style={{
          position: 'absolute',
          top: '68%',
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: 'translateY(-50%)',
        }}
      >
        <p
          style={{
            fontSize: 'clamp(13px, 4.5cqi, 22px)',
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

      {/* Instruction text - positioned at ~87% from top, two lines */}
      <div
        style={{
          position: 'absolute',
          top: '87%',
          left: '8%',
          right: '8%',
          textAlign: 'center',
          transform: 'translateY(-50%)',
        }}
      >
        <p
          style={{
            fontSize: 'clamp(8px, 2.8cqi, 13px)',
            color: '#9CA3AF',
            fontFamily: "'Nanum Myeongjo', serif",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {'연락이 필요하시면 QR코드를'}
          <br />
          {'카메라로 인식해주세요.'}
        </p>
      </div>
    </div>
  );
}
