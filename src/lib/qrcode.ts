import QRCode from 'qrcode';
import type { CardData } from '@/types/card';

/**
 * Escape special characters for vCard format.
 * vCard 3.0 requires escaping backslashes, semicolons, commas, and newlines.
 */
function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate a vCard 3.0 string from card data.
 * Includes name, title, and social links mapped to appropriate vCard fields.
 */
export function generateVCard(card: CardData): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardValue(card.front.displayName)}`,
    `N:${escapeVCardValue(card.back.fullName)};;;`,
  ];

  if (card.back.title) {
    lines.push(`TITLE:${escapeVCardValue(card.back.title)}`);
  }

  for (const link of card.back.socialLinks) {
    if (!link.url) continue;

    switch (link.platform) {
      case 'phone':
        lines.push(`TEL;TYPE=CELL:${link.url}`);
        break;
      case 'email':
        lines.push(`EMAIL:${link.url}`);
        break;
      case 'linkedin':
        lines.push(`URL;TYPE=LinkedIn:${link.url}`);
        break;
      case 'instagram':
        lines.push(`URL;TYPE=Instagram:${link.url}`);
        break;
      case 'facebook':
        lines.push(`URL;TYPE=Facebook:${link.url}`);
        break;
      case 'youtube':
        lines.push(`URL;TYPE=YouTube:${link.url}`);
        break;
      case 'custom':
        lines.push(`URL:${link.url}`);
        break;
    }
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/**
 * Generate a QR code as a data URL (PNG base64).
 * Uses the qrcode npm package for client-side generation.
 */
export async function generateQRDataURL(
  text: string,
  size: number = 256
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 2,
    color: {
      dark: '#020912',
      light: '#ffffff',
    },
  });
}

/**
 * Build the public URL for a card.
 * Uses window.location.origin when available, empty string on server.
 */
export function getCardPublicURL(cardId: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/cards/${cardId}`;
}
