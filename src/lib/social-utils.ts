/**
 * Extracts a clean display handle from a social media URL or value.
 *
 * Examples:
 *   "https://instagram.com/username/" -> "username"
 *   "https://www.linkedin.com/in/john-doe" -> "john-doe"
 *   "https://facebook.com/pagename" -> "pagename"
 *   "https://blog.naver.com/myblog" -> "myblog"
 *   "user@example.com" -> "user@example.com"
 */
export function extractHandle(value: string): string {
  if (!value) return '';

  // Remove protocol
  let clean = value.replace(/^https?:\/\//, '');
  // Remove www.
  clean = clean.replace(/^www\./, '');

  // For known social platforms, extract the meaningful path part
  // instagram.com/username/ -> username
  // linkedin.com/in/username/ -> username
  // facebook.com/username -> username
  // blog.naver.com/username -> username
  const pathMatch = clean.match(
    /(?:instagram\.com|linkedin\.com\/in|facebook\.com|blog\.naver\.com)\/([^/?#]+)/
  );
  if (pathMatch) {
    return pathMatch[1].replace(/\/$/, '');
  }

  // For other URLs with paths (e.g., linkedin.com/in/name)
  const genericPathMatch = clean.match(/[^/]+\/(?:in\/)?([^/?#]+)/);
  if (genericPathMatch && clean.includes('.')) {
    return genericPathMatch[1].replace(/\/$/, '');
  }

  // Remove trailing slashes
  return value.replace(/\/$/, '');
}
