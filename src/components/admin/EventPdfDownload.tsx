'use client';

import { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
import { extractHandle } from '@/lib/social-utils';
import type { CardFrontData, CardBackData, CardTheme, HarrypotterMeta, TarotMeta } from '@/types/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventPdfDownloadProps {
  eventId: string;
  eventName: string;
  participantCount: number;
}

interface EventCardItem {
  id: string;
  card: {
    front: CardFrontData;
    back: CardBackData;
    theme: CardTheme;
    pokemonMeta?: { type: string; exp: number };
    hearthstoneMeta?: { mana: number; attack: number; health: number };
    harrypotterMeta?: HarrypotterMeta;
    tarotMeta?: TarotMeta;
  };
  illustrationUrl: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CARD_W = 290;
const CARD_H = 450;
const FONT_FAMILY = "'Nanum Myeongjo', serif";
const PIXEL_RATIO = 2;
const PNG_QUALITY = 0.85;

// A4 dimensions in mm
const A4_W = 210;
const A4_H = 297;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wait for an image URL to be fully loaded. Returns true on success.
 */
function preloadImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

/** Small delay helper to avoid memory pressure between captures. */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Format today as YYYY-MM-DD. */
function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// Simplified card renderers (inline-style DOM elements for html-to-image)
// ---------------------------------------------------------------------------

function renderFrontElement(
  card: EventCardItem['card'],
  illustrationUrl: string | null,
): HTMLDivElement {
  const container = document.createElement('div');
  Object.assign(container.style, {
    width: `${CARD_W}px`,
    height: `${CARD_H}px`,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: card.front.backgroundColor || '#1a1a2e',
    fontFamily: FONT_FAMILY,
    borderRadius: '8px',
  });

  // Illustration image (full cover)
  if (illustrationUrl) {
    const resolvedUrl = convertGoogleDriveUrl(illustrationUrl) || illustrationUrl;
    const img = document.createElement('img');
    img.src = resolvedUrl;
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    Object.assign(img.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    });
    container.appendChild(img);
  } else {
    // Placeholder when no illustration
    const placeholder = document.createElement('div');
    Object.assign(placeholder.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.05)',
    });
    const span = document.createElement('span');
    span.textContent = 'No Image';
    Object.assign(span.style, {
      color: 'rgba(0,0,0,0.3)',
      fontSize: '14px',
      fontFamily: FONT_FAMILY,
    });
    placeholder.appendChild(span);
    container.appendChild(placeholder);
  }

  // Name overlay at top-left
  const textColor = card.front.textColor || '#FFFFFF';
  const nameWrap = document.createElement('div');
  Object.assign(nameWrap.style, {
    position: 'relative',
    zIndex: '10',
    padding: '20px',
    paddingTop: '16px',
  });

  const h1 = document.createElement('h1');
  h1.textContent = card.front.displayName || 'YOUR NAME';
  Object.assign(h1.style, {
    fontSize: '24px',
    fontWeight: 'bold',
    color: textColor,
    fontFamily: FONT_FAMILY,
    textShadow:
      textColor.toUpperCase() === '#FFFFFF'
        ? '0 1px 3px rgba(0,0,0,0.5)'
        : '0 1px 3px rgba(255,255,255,0.3)',
    margin: '0',
    lineHeight: '1.3',
    wordBreak: 'break-word',
  });
  nameWrap.appendChild(h1);
  container.appendChild(nameWrap);

  // Theme badge (bottom-right corner)
  if (card.theme && card.theme !== 'classic') {
    const badge = document.createElement('div');
    Object.assign(badge.style, {
      position: 'absolute',
      bottom: '12px',
      right: '12px',
      zIndex: '10',
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: '4px',
      padding: '2px 8px',
    });
    const badgeText = document.createElement('span');
    const themeLabels: Record<string, string> = {
      pokemon: 'Pokemon',
      hearthstone: 'Hearthstone',
      harrypotter: 'Harry Potter',
      tarot: 'Tarot',
    };
    badgeText.textContent = themeLabels[card.theme] || card.theme;
    Object.assign(badgeText.style, {
      fontSize: '10px',
      color: '#FFFFFF',
      fontFamily: FONT_FAMILY,
    });
    badge.appendChild(badgeText);
    container.appendChild(badge);
  }

  return container;
}

function renderBackElement(card: EventCardItem['card']): HTMLDivElement {
  const container = document.createElement('div');
  Object.assign(container.style, {
    width: `${CARD_W}px`,
    height: `${CARD_H}px`,
    overflow: 'hidden',
    backgroundColor: card.back.backgroundColor || '#16213e',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: FONT_FAMILY,
    borderRadius: '8px',
    boxSizing: 'border-box',
  });

  const textColor = card.back.textColor || '#FFFFFF';

  // Full name
  const h2 = document.createElement('h2');
  h2.textContent = card.back.fullName || 'FULL NAME';
  Object.assign(h2.style, {
    fontSize: '22px',
    fontWeight: 'bold',
    color: textColor,
    fontFamily: FONT_FAMILY,
    margin: '0 0 4px 0',
    lineHeight: '1.3',
    wordBreak: 'break-word',
  });
  container.appendChild(h2);

  // Title
  if (card.back.title) {
    const p = document.createElement('p');
    p.textContent = card.back.title;
    Object.assign(p.style, {
      fontSize: '16px',
      color: textColor,
      opacity: '0.9',
      fontFamily: FONT_FAMILY,
      margin: '0 0 12px 0',
      lineHeight: '1.4',
      wordBreak: 'break-word',
    });
    container.appendChild(p);
  }

  // Hashtags
  if (card.back.hashtags && card.back.hashtags.length > 0) {
    const tagWrap = document.createElement('div');
    Object.assign(tagWrap.style, {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      marginTop: '4px',
      overflow: 'hidden',
      maxHeight: '120px',
    });

    for (const tag of card.back.hashtags) {
      const span = document.createElement('span');
      span.textContent = tag.startsWith('#') ? tag : `#${tag}`;
      Object.assign(span.style, {
        fontSize: '14px',
        color: textColor,
        fontFamily: FONT_FAMILY,
        opacity: '0.85',
      });
      tagWrap.appendChild(span);
    }
    container.appendChild(tagWrap);
  }

  // Spacer to push social links to bottom
  const spacer = document.createElement('div');
  Object.assign(spacer.style, { flex: '1' });
  container.appendChild(spacer);

  // Social links at the bottom
  const platformOrder = ['phone', 'youtube', 'facebook', 'instagram', 'linkedin', 'email'];
  const sortedLinks = (card.back.socialLinks || [])
    .filter((l) => l.url || l.label)
    .sort((a, b) => {
      const aIdx = platformOrder.indexOf(a.platform);
      const bIdx = platformOrder.indexOf(b.platform);
      return (aIdx === -1 ? platformOrder.length : aIdx) - (bIdx === -1 ? platformOrder.length : bIdx);
    });

  if (sortedLinks.length > 0) {
    const linkSection = document.createElement('div');
    Object.assign(linkSection.style, {
      borderTop: `1px solid ${textColor}33`,
      paddingTop: '8px',
      marginTop: '8px',
    });

    for (const link of sortedLinks) {
      const p = document.createElement('p');
      p.textContent = `${link.platform}/${extractHandle(link.url || link.label)}`;
      Object.assign(p.style, {
        fontSize: '10px',
        color: textColor,
        opacity: '0.7',
        textAlign: 'right',
        margin: '0',
        lineHeight: '1.8',
        fontFamily: FONT_FAMILY,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      });
      linkSection.appendChild(p);
    }
    container.appendChild(linkSection);
  }

  return container;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EventPdfDownload({
  eventId,
  eventName,
  participantCount,
}: EventPdfDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const hiddenRef = useRef<HTMLDivElement>(null);

  const generatePdf = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setProgress('데이터 불러오는 중...');

    try {
      // ------------------------------------------------------------------
      // 1. Fetch card data from the API
      // ------------------------------------------------------------------
      const adminToken = document.cookie
        .split('; ')
        .find((c) => c.startsWith('admin_token='))
        ?.split('=')[1];

      const res = await fetch(`/api/admin/events/${eventId}/cards`, {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const json = await res.json();
      const cards: EventCardItem[] = json.cards ?? [];

      if (cards.length === 0) {
        alert('이 이벤트에 카드가 없습니다.');
        return;
      }

      // ------------------------------------------------------------------
      // 2. Preload illustration images
      // ------------------------------------------------------------------
      setProgress('이미지 로딩 중...');
      const imagePromises = cards.map((c) => {
        if (c.illustrationUrl) {
          const resolved = convertGoogleDriveUrl(c.illustrationUrl) || c.illustrationUrl;
          return preloadImage(resolved);
        }
        return Promise.resolve(true);
      });
      await Promise.all(imagePromises);

      // ------------------------------------------------------------------
      // 3. Create hidden off-screen container
      // ------------------------------------------------------------------
      const hiddenContainer = hiddenRef.current;
      if (!hiddenContainer) {
        throw new Error('Hidden container not found');
      }
      hiddenContainer.innerHTML = '';

      // ------------------------------------------------------------------
      // 4. Create PDF
      // ------------------------------------------------------------------
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Usable area with margins (10mm each side)
      const marginX = 10;
      const marginY = 10;
      const usableW = A4_W - marginX * 2;
      const headerH = 8; // space for name header

      // Each card pair: front + back side by side
      // Card aspect ratio is 29:45
      const cardDisplayH = A4_H - marginY * 2 - headerH;
      const cardDisplayW = cardDisplayH * (29 / 45);

      // If two cards + gap exceed usable width, scale down
      const gap = 6; // mm between front and back
      let pairW = cardDisplayW * 2 + gap;
      let scale = 1;
      if (pairW > usableW) {
        scale = usableW / pairW;
        pairW = usableW;
      }
      const finalCardW = cardDisplayW * scale;
      const finalCardH = cardDisplayH * scale;

      // Center the pair horizontally
      const pairX = marginX + (usableW - pairW) / 2;

      for (let i = 0; i < cards.length; i++) {
        const cardItem = cards[i];
        setProgress(`PDF 생성 중... (${i + 1}/${cards.length})`);

        // Add new page (except first)
        if (i > 0) {
          pdf.addPage();
        }

        // Page header - participant name
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        const headerText = `${cardItem.card.front.displayName || 'Unknown'} - ${cardItem.card.back.title || ''}`.trim();
        pdf.text(headerText, A4_W / 2, marginY + 4, { align: 'center' });

        // Render front card into hidden container
        hiddenContainer.innerHTML = '';
        const frontEl = renderFrontElement(cardItem.card, cardItem.illustrationUrl);
        hiddenContainer.appendChild(frontEl);

        // Wait a tick for rendering
        await delay(100);

        // Capture front
        let frontDataUrl: string;
        try {
          frontDataUrl = await toPng(frontEl, {
            quality: PNG_QUALITY,
            pixelRatio: PIXEL_RATIO,
            cacheBust: true,
          });
        } catch {
          // If capture fails, create a placeholder
          frontDataUrl = '';
        }

        // Render back card
        hiddenContainer.innerHTML = '';
        const backEl = renderBackElement(cardItem.card);
        hiddenContainer.appendChild(backEl);

        await delay(100);

        // Capture back
        let backDataUrl: string;
        try {
          backDataUrl = await toPng(backEl, {
            quality: PNG_QUALITY,
            pixelRatio: PIXEL_RATIO,
            cacheBust: true,
          });
        } catch {
          backDataUrl = '';
        }

        // Place images into the PDF
        const cardY = marginY + headerH;

        if (frontDataUrl) {
          pdf.addImage(frontDataUrl, 'PNG', pairX, cardY, finalCardW, finalCardH);
        } else {
          // Draw placeholder rectangle
          pdf.setDrawColor(200);
          pdf.setFillColor(240, 240, 240);
          pdf.rect(pairX, cardY, finalCardW, finalCardH, 'FD');
          pdf.setFontSize(8);
          pdf.setTextColor(150);
          pdf.text('Front (capture failed)', pairX + finalCardW / 2, cardY + finalCardH / 2, { align: 'center' });
        }

        if (backDataUrl) {
          pdf.addImage(
            backDataUrl,
            'PNG',
            pairX + finalCardW + gap * scale,
            cardY,
            finalCardW,
            finalCardH,
          );
        } else {
          const backX = pairX + finalCardW + gap * scale;
          pdf.setDrawColor(200);
          pdf.setFillColor(240, 240, 240);
          pdf.rect(backX, cardY, finalCardW, finalCardH, 'FD');
          pdf.setFontSize(8);
          pdf.setTextColor(150);
          pdf.text('Back (capture failed)', backX + finalCardW / 2, cardY + finalCardH / 2, { align: 'center' });
        }

        // "Front" / "Back" labels
        pdf.setFontSize(7);
        pdf.setTextColor(160, 160, 160);
        pdf.text('Front', pairX + finalCardW / 2, cardY + finalCardH + 4, { align: 'center' });
        pdf.text('Back', pairX + finalCardW + gap * scale + finalCardW / 2, cardY + finalCardH + 4, { align: 'center' });

        // Clean up DOM
        hiddenContainer.innerHTML = '';

        // Small delay between cards to reduce memory pressure
        await delay(50);
      }

      // ------------------------------------------------------------------
      // 5. Download PDF
      // ------------------------------------------------------------------
      const fileName = `${eventName}_명함_${todayString()}.pdf`;
      pdf.save(fileName);
      setProgress('');
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF 생성에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsGenerating(false);
      setProgress('');
      if (hiddenRef.current) {
        hiddenRef.current.innerHTML = '';
      }
    }
  }, [eventId, eventName, isGenerating]);

  return (
    <>
      <button
        type="button"
        onClick={generatePdf}
        disabled={isGenerating || participantCount === 0}
        className={`min-h-[44px] px-4 text-sm font-medium rounded-lg inline-flex items-center gap-2 transition-colors ${
          isGenerating || participantCount === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-amber-600 text-white hover:bg-amber-700'
        }`}
        aria-label={`${eventName} PDF 다운로드`}
      >
        {/* Document icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        {isGenerating ? 'PDF 생성 중...' : 'PDF 다운로드'}
      </button>

      {/* Progress overlay */}
      {isGenerating && progress && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="status"
          aria-live="polite"
        >
          <div className="bg-white rounded-xl shadow-2xl px-8 py-6 flex flex-col items-center gap-3 min-w-[240px]">
            {/* Spinner */}
            <svg
              className="animate-spin h-8 w-8 text-amber-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700">{progress}</p>
          </div>
        </div>
      )}

      {/* Hidden off-screen container for html-to-image capture */}
      <div
        ref={hiddenRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: `${CARD_W}px`,
          zIndex: -1,
          pointerEvents: 'none',
          opacity: 0,
        }}
      />
    </>
  );
}
