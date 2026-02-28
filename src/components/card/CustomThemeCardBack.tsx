'use client';

import { useState, useEffect, useRef } from 'react';
import { useCustomThemes } from '@/hooks/useCustomThemes';
import { extractHandle } from '@/lib/social-utils';
import { renderMultiLine } from '@/lib/text-utils';
import { getPhoneTelURI, generateQRDataURL } from '@/lib/qrcode';
import { useCardData } from './CardDataProvider';
import { ClassicCardBack } from './CardBack';
import type { CustomTheme } from '@/types/custom-theme';

interface CustomThemeCardBackProps {
  themeSlug: string;
}

/**
 * CustomThemeCardBack - Renders the back of a custom-themed card.
 * Delegates to a classic or nametag base layout with custom colors, font, and border.
 * Falls back to ClassicCardBack if the theme definition is not found.
 * Displays custom field values from card.customThemeMeta when defined.
 * All visual styles are inline for html-to-image compatibility.
 */
export function CustomThemeCardBack({ themeSlug }: CustomThemeCardBackProps) {
  const { themes } = useCustomThemes();
  const themeDef = themes?.find((t) => t.slug === themeSlug) ?? null;

  if (!themeDef) {
    return <ClassicCardBack />;
  }

  if (themeDef.baseTemplate === 'nametag') {
    return <CustomNametagBack themeDef={themeDef} />;
  }

  return <CustomClassicBack themeDef={themeDef} />;
}

/**
 * CustomClassicBack - Classic layout (aspect-[29/45]) with custom theme colors/font/border.
 * Same structure as ClassicCardBack: name, title, hashtags, social links, plus custom fields.
 */
function CustomClassicBack({ themeDef }: { themeDef: CustomTheme }) {
  const card = useCardData();
  const { back } = card;

  const fontFamily = themeDef.fontFamily || "'Nanum Myeongjo', serif";
  const textColor = themeDef.backTextColor || back.textColor || '#000000';
  const bgColor = themeDef.backBgColor || back.backgroundColor;
  const borderColor = themeDef.backBorderColor || 'transparent';
  const borderStyle = themeDef.borderStyle || 'none';
  const borderWidth = themeDef.borderWidth || 0;
  const accentColor = themeDef.accentColor || textColor;

  // Gather custom field values
  const customMeta = card.customThemeMeta ?? {};
  const customFields = themeDef.customFields ?? [];

  // Sort social links by platform order
  const platformOrder = ['phone', 'youtube', 'facebook', 'instagram', 'linkedin', 'email'];
  const sortedLinks = back.socialLinks
    .filter((link) => link.url || link.label)
    .sort((a, b) => {
      const aIdx = platformOrder.indexOf(a.platform);
      const bIdx = platformOrder.indexOf(b.platform);
      return (aIdx === -1 ? platformOrder.length : aIdx) - (bIdx === -1 ? platformOrder.length : bIdx);
    });

  return (
    <div
      id="card-back"
      className="relative w-full aspect-[29/45] overflow-hidden flex flex-col"
      style={{
        backgroundColor: bgColor,
        fontFamily,
        borderColor,
        borderStyle,
        borderWidth: borderStyle !== 'none' ? `${borderWidth}px` : undefined,
        boxSizing: 'border-box',
        padding: '16px',
      }}
    >
      {/* Upper area: Name, title, hashtags */}
      <div className="flex-1 min-h-0">
        <h2
          className="font-bold"
          title={back.fullName || 'FULL NAME'}
          style={{
            fontSize: '24px',
            color: textColor,
            fontFamily,
            marginBottom: '4px',
          }}
        >
          {renderMultiLine(back.fullName || 'FULL NAME')}
        </h2>
        <p
          title={back.title || 'Your Title'}
          style={{
            fontSize: '20px',
            color: textColor,
            opacity: 0.9,
            fontFamily,
            marginBottom: '16px',
          }}
        >
          {renderMultiLine(back.title || 'Your Title')}
        </p>
        <div className="flex flex-wrap gap-1 overflow-hidden" style={{ maxHeight: '8rem' }}>
          {back.hashtags.map((tag, i) => {
            const tagText = tag.startsWith('#') ? tag : `#${tag}`;
            return (
              <span
                key={i}
                style={{
                  fontWeight: 500,
                  fontSize: '20px',
                  color: textColor,
                  fontFamily,
                }}
              >
                {renderMultiLine(tagText)}
              </span>
            );
          })}
        </div>

        {/* Custom field values */}
        {customFields.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            {customFields.map((field) => {
              const value = customMeta[field.key];
              if (value === undefined || value === '') return null;
              return (
                <div
                  key={field.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      color: textColor,
                      opacity: 0.6,
                      fontFamily,
                    }}
                  >
                    {field.label}
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: accentColor,
                      fontFamily,
                    }}
                  >
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom area: Social links */}
      {sortedLinks.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          {sortedLinks.map((link, i) => (
            <p
              key={i}
              style={{
                fontSize: '12px',
                paddingTop: '6px',
                paddingBottom: '6px',
                textAlign: 'right',
                color: textColor,
                opacity: 0.8,
                fontFamily,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {link.label ? `${link.label}${link.url ? ` ${extractHandle(link.url)}` : ''}` : extractHandle(link.url || '')}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * CustomNametagBack - Nametag layout (aspect-[197/354]) with custom theme colors/font.
 * Same structure as NametagCardBack: QR code, Korean name, English name, instruction text.
 * Includes custom field values display and ResizeObserver for responsive font sizing.
 */
function CustomNametagBack({ themeDef }: { themeDef: CustomTheme }) {
  const card = useCardData();
  const { front, back } = card;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Track container width for responsive font sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const fontFamily = themeDef.fontFamily || "'Nanum Myeongjo', serif";
  const textColor = themeDef.backTextColor || '#020912';
  const bgColor = themeDef.backBgColor || '#FFFFFF';
  const borderColor = themeDef.backBorderColor || 'transparent';
  const borderStyle = themeDef.borderStyle || 'none';
  const borderWidth = themeDef.borderWidth || 0;
  const accentColor = themeDef.accentColor || textColor;

  // Gather custom field values
  const customMeta = card.customThemeMeta ?? {};
  const customFields = themeDef.customFields ?? [];

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

  // Determine if custom fields exist to adjust layout proportions
  const hasCustomFields = customFields.length > 0 &&
    customFields.some((f) => customMeta[f.key] !== undefined && customMeta[f.key] !== '');

  return (
    <div
      ref={containerRef}
      id="card-back"
      className="relative w-full aspect-[197/354] overflow-hidden"
      style={{
        backgroundColor: bgColor,
        fontFamily,
        position: 'relative',
        borderColor,
        borderStyle,
        borderWidth: borderStyle !== 'none' ? `${borderWidth}px` : undefined,
        boxSizing: 'border-box',
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
                fontFamily,
              }}
            >
              QR Code
            </span>
          </div>
        )}
      </div>

      {/* Korean name - positioned at ~59.3% from top */}
      <div
        style={{
          position: 'absolute',
          top: hasCustomFields ? '55%' : '59.3%',
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
            color: textColor,
            fontFamily,
            letterSpacing: '0.45em',
            margin: 0,
            lineHeight: 1.2,
            paddingLeft: '0.45em',
          }}
        >
          {back.fullName || 'FULL NAME'}
        </h2>
      </div>

      {/* English name - positioned at ~68.7% from top */}
      <div
        style={{
          position: 'absolute',
          top: hasCustomFields ? '64%' : '68.7%',
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: 'translateY(-50%)',
        }}
      >
        <p
          style={{
            fontSize: `${englishNameSize}px`,
            color: textColor,
            fontFamily,
            margin: 0,
            lineHeight: 1.4,
            letterSpacing: '0.08em',
            opacity: 0.7,
          }}
        >
          {front.displayName || 'YOUR NAME'}
        </p>
      </div>

      {/* Custom fields - positioned between name and instruction */}
      {hasCustomFields && (
        <div
          style={{
            position: 'absolute',
            top: '72%',
            left: '10%',
            right: '10%',
            textAlign: 'center',
            transform: 'translateY(-50%)',
          }}
        >
          {customFields.map((field) => {
            const value = customMeta[field.key];
            if (value === undefined || value === '') return null;
            return (
              <p
                key={field.key}
                style={{
                  fontSize: `${Math.max(8, Math.round(containerWidth * 0.028))}px`,
                  color: accentColor,
                  fontFamily,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {field.label}: {value}
              </p>
            );
          })}
        </div>
      )}

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
            fontFamily,
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
