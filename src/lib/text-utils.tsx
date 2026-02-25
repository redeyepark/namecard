import type { ReactNode } from 'react';

/**
 * Splits text by '|' delimiter and renders each part on a separate line.
 * If the text does not contain '|', it is returned as-is.
 * Whitespace around '|' is trimmed.
 */
export function renderMultiLine(text: string): ReactNode {
  if (!text.includes('|')) return text;
  return text.split('|').map((part, i) => (
    <span key={i} className="block">{part.trim()}</span>
  ));
}
