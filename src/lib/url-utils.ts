/**
 * Convert Google Drive sharing URLs to direct image URLs.
 * Transforms viewer/sharing links to lh3.googleusercontent.com format
 * that serves image data directly, allowing <img> tags to render them.
 *
 * Supports the following Google Drive URL patterns:
 * - drive.google.com/open?id=FILE_ID
 * - drive.google.com/file/d/FILE_ID/...
 * - docs.google.com/uc?id=FILE_ID
 *
 * @param url - The URL to convert
 * @returns The converted URL, or the original URL if no pattern matches
 */
export function convertGoogleDriveUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;

  // Pattern 1: drive.google.com/open?id=FILE_ID
  let match = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;

  // Pattern 2: drive.google.com/file/d/FILE_ID/...
  match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;

  // Pattern 3: docs.google.com/uc?id=FILE_ID
  match = url.match(/docs\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;

  return url;
}
