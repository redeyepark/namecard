'use client';

import { useState, useEffect } from 'react';
import { useCardStore } from '@/stores/useCardStore';
import { generateVCard, generateQRDataURL } from '@/lib/qrcode';

/**
 * NametagCardBack - Corporate name tag style back layout.
 * White background with centered QR code, Korean name with letter-spacing,
 * English name below, and instruction text at the bottom.
 * Uses a different aspect ratio (197:354) matching real corporate name tag dimensions.
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* QR Code - centered in upper portion */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR Code"
            style={{
              width: '55%',
              height: 'auto',
              imageRendering: 'pixelated',
            }}
          />
        ) : (
          <div
            style={{
              width: '55%',
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

      {/* Korean name - large bold text with letter-spacing */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '8px',
        }}
      >
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#020912',
            fontFamily: "'Nanum Myeongjo', serif",
            letterSpacing: '0.5em',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {back.fullName || 'FULL NAME'}
        </h2>
      </div>

      {/* English name - medium text */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '24px',
        }}
      >
        <p
          style={{
            fontSize: '14px',
            color: '#374151',
            fontFamily: "'Nanum Myeongjo', serif",
            margin: 0,
            lineHeight: 1.4,
            letterSpacing: '0.1em',
          }}
        >
          {front.displayName || 'YOUR NAME'}
        </p>
      </div>

      {/* Instruction text at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '16px',
          right: '16px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '10px',
            color: '#9CA3AF',
            fontFamily: "'Nanum Myeongjo', serif",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {'연락이 필요하시면 QR코드를 카메라로 인식해주세요.'}
        </p>
      </div>
    </div>
  );
}
