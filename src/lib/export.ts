import { toPng, toBlob } from 'html-to-image';

export async function exportCardAsPng(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Export a card element as a Blob (PNG format at 2x resolution).
 * Useful for clipboard operations and sharing APIs that require Blob input.
 */
export async function exportCardAsBlob(element: HTMLElement): Promise<Blob> {
  const blob = await toBlob(element, {
    pixelRatio: 2,
    cacheBust: true,
  });
  if (!blob) {
    throw new Error('Failed to generate image blob');
  }
  return blob;
}
