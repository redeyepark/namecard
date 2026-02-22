import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveRequest } from '@/lib/storage';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import type { CardRequest } from '@/types/request';
import type { SocialLink } from '@/types/card';

interface BulkUploadResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

/**
 * Parse a CSV line respecting quoted fields.
 * Handles values wrapped in double quotes that may contain commas.
 * Escaped quotes ("") inside quoted fields are unescaped.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ("")
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      current += char;
      i++;
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (char === ',') {
        fields.push(current.trim());
        current = '';
        i++;
        continue;
      }
      current += char;
      i++;
    }
  }

  // Push the last field
  fields.push(current.trim());

  return fields;
}

/**
 * Extract hex color from a background color string.
 * Examples: "블랙 #000000" -> "#000000", "#FF5733" -> "#FF5733"
 */
function extractHexColor(raw: string): string {
  const hexMatch = raw.match(/#[0-9A-Fa-f]{6}\b/);
  if (hexMatch) {
    return hexMatch[0];
  }
  // Fallback: return the raw value trimmed, or default black
  return raw.trim() || '#000000';
}

/**
 * Ensure a hashtag string starts with #.
 */
function normalizeHashtag(tag: string): string {
  const trimmed = tag.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

/**
 * Check if a row is entirely empty (all columns are blank).
 */
function isEmptyRow(columns: string[]): boolean {
  return columns.every((col) => col.trim() === '');
}

/**
 * Build a CardRequest from parsed CSV columns.
 */
function buildCardRequest(columns: string[]): CardRequest {
  const [
    photoUrl,
    frontName,
    backName,
    interest,
    keyword1,
    keyword2,
    keyword3,
    email,
    facebook,
    instagram,
    linkedin,
    bgColorRaw,
  ] = columns;

  if (!frontName || frontName.trim() === '') {
    throw new Error('displayName (column 2) is required');
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  // Build hashtags array, filtering out empties and normalizing # prefix
  const hashtags = [keyword1, keyword2, keyword3]
    .map(normalizeHashtag)
    .filter((tag) => tag !== '');

  // Build social links, filtering out empty values
  const socialLinks: SocialLink[] = [];

  if (email && email.trim()) {
    socialLinks.push({
      platform: 'email',
      url: email.trim(),
      label: email.trim(),
    });
  }

  if (facebook && facebook.trim()) {
    socialLinks.push({
      platform: 'facebook',
      url: facebook.trim(),
      label: 'Facebook',
    });
  }

  if (instagram && instagram.trim()) {
    socialLinks.push({
      platform: 'instagram',
      url: instagram.trim(),
      label: 'Instagram',
    });
  }

  if (linkedin && linkedin.trim()) {
    socialLinks.push({
      platform: 'linkedin',
      url: linkedin.trim(),
      label: 'LinkedIn',
    });
  }

  // Extract hex color for background
  const backgroundColor = extractHexColor(bgColorRaw || '');

  const cardRequest: CardRequest = {
    id,
    card: {
      front: {
        displayName: frontName.trim(),
        avatarImage: null,
        backgroundColor,
      },
      back: {
        fullName: (backName || '').trim(),
        title: (interest || '').trim(),
        hashtags,
        socialLinks,
        backgroundColor,
      },
    },
    originalAvatarPath: photoUrl && photoUrl.trim() ? photoUrl.trim() : null,
    illustrationPath: null,
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
    createdBy: 'admin-bulk-upload',
    statusHistory: [{ status: 'submitted', timestamp: now }],
  };

  return cardRequest;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminToken();

    const body = await request.json();
    const { csv } = body as { csv?: string };

    if (!csv || typeof csv !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request', details: 'csv field is required and must be a string' },
        { status: 400 }
      );
    }

    // Split into lines and filter out completely empty lines
    const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== '');

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'Invalid CSV', details: 'CSV must contain a header row and at least one data row' },
        { status: 400 }
      );
    }

    // Skip header row (first line)
    const dataLines = lines.slice(1);

    const result: BulkUploadResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < dataLines.length; i++) {
      const rowNumber = i + 2; // 1-based, accounting for header
      const line = dataLines[i];

      try {
        const columns = parseCSVLine(line);

        // Skip empty rows
        if (isEmptyRow(columns)) {
          continue;
        }

        // Validate column count
        if (columns.length < 12) {
          throw new Error(
            `Expected 12 columns but got ${columns.length}`
          );
        }

        const cardRequest = buildCardRequest(columns);
        await saveRequest(cardRequest);
        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
