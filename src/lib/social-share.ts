import { openSharePopup } from './share-utils';

/**
 * Open a Facebook share dialog for the given URL.
 */
export function shareFacebook(url: string): void {
  openSharePopup(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    600,
    400
  );
}

/**
 * Open a Twitter/X share dialog with a URL and text.
 */
export function shareTwitter(url: string, text: string): void {
  openSharePopup(
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    600,
    400
  );
}

/**
 * Open a LinkedIn share dialog for the given URL and title.
 */
export function shareLinkedIn(url: string, title: string): void {
  openSharePopup(
    `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    600,
    500
  );
}

/**
 * Open a LINE share dialog for the given URL.
 */
export function shareLine(url: string): void {
  openSharePopup(
    `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
    500,
    500
  );
}
