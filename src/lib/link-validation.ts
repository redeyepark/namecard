/**
 * URL validation and sanitization utilities for user links (SPEC-LINKBIO-001).
 */

/**
 * Validate a URL for safety and correctness.
 * Blocks javascript: protocol, data: URIs, and requires http/https.
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = url.trim().toLowerCase();

  // Block javascript: protocol
  if (trimmed.startsWith('javascript:')) {
    return { valid: false, error: 'javascript: URLs are not allowed' };
  }

  // Block data: URIs
  if (trimmed.startsWith('data:')) {
    return { valid: false, error: 'data: URLs are not allowed' };
  }

  // Require http:// or https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { valid: false, error: 'URL must start with http:// or https://' };
  }

  // Basic URL structure validation
  try {
    new URL(url.trim());
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  return { valid: true };
}

/**
 * Sanitize a URL by trimming whitespace and normalizing protocol.
 * Adds https:// if no protocol is present.
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();

  if (!trimmed) {
    return trimmed;
  }

  // If no protocol, add https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }

  return trimmed;
}
