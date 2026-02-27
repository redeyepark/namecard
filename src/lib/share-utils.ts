// Feature detection utilities for Web Share API, Clipboard API, and Kakao SDK

/**
 * Check if the Web Share API is available in the current browser.
 */
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Check if the browser supports writing images to the clipboard.
 * Requires both navigator.clipboard.write and ClipboardItem.
 */
export function canCopyImageToClipboard(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard !== 'undefined' &&
    typeof navigator.clipboard.write === 'function' &&
    typeof ClipboardItem !== 'undefined'
  );
}

/**
 * Check if the Kakao JavaScript SDK is loaded and initialized.
 */
export function isKakaoAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as { Kakao?: { isInitialized?: () => boolean } };
  return typeof win.Kakao !== 'undefined' && typeof win.Kakao.isInitialized === 'function' && win.Kakao.isInitialized();
}

/**
 * Open a share popup window centered on the screen.
 * Falls back to redirecting the current page if the popup is blocked.
 */
export function openSharePopup(url: string, width: number = 600, height: number = 400): void {
  const left = Math.round((window.screen.width - width) / 2);
  const top = Math.round((window.screen.height - height) / 2);
  const features = `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,resizable=yes,scrollbars=yes`;

  const popup = window.open(url, '_blank', features);

  // Fallback if popup was blocked
  if (!popup || popup.closed) {
    window.location.href = url;
  }
}

/**
 * Copy text to clipboard with fallback for older browsers.
 * Returns true on success, false on failure.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  // Modern Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy approach
    }
  }

  // Legacy fallback using textarea + execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Copy an image blob to the clipboard.
 * Handles Safari and Chrome differences in ClipboardItem construction.
 * Returns true on success, false on failure.
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (!canCopyImageToClipboard()) {
    return false;
  }

  try {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    let clipboardItem: ClipboardItem;
    if (isSafari) {
      // Safari requires a Promise-based ClipboardItem
      clipboardItem = new ClipboardItem({
        'image/png': Promise.resolve(blob),
      });
    } else {
      // Chrome and other browsers accept a Blob directly
      clipboardItem = new ClipboardItem({
        'image/png': blob,
      });
    }

    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a composite image by placing front and back card images side by side.
 * Returns a PNG blob of the combined image.
 */
export async function createCompositeImage(
  frontBlob: Blob,
  backBlob: Blob,
  gap: number = 20
): Promise<Blob> {
  const [frontBitmap, backBitmap] = await Promise.all([
    createImageBitmap(frontBlob),
    createImageBitmap(backBlob),
  ]);

  const canvasWidth = frontBitmap.width + gap + backBitmap.width;
  const canvasHeight = Math.max(frontBitmap.height, backBitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    frontBitmap.close();
    backBitmap.close();
    throw new Error('Failed to get canvas 2D context');
  }

  // Fill background with white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw front image on the left, vertically centered
  const frontY = Math.round((canvasHeight - frontBitmap.height) / 2);
  ctx.drawImage(frontBitmap, 0, frontY);

  // Draw back image on the right, vertically centered
  const backX = frontBitmap.width + gap;
  const backY = Math.round((canvasHeight - backBitmap.height) / 2);
  ctx.drawImage(backBitmap, backX, backY);

  // Clean up bitmaps
  frontBitmap.close();
  backBitmap.close();

  // Convert canvas to blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to generate composite image blob'));
        }
      },
      'image/png'
    );
  });
}
