import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveRequest } from '@/lib/storage';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import { getSupabase } from '@/lib/supabase';
import type { CardRequest } from '@/types/request';
import type { SocialLink } from '@/types/card';

interface BulkUploadResult {
  success: number;
  failed: number;
  autoRegistered: number;
  errors: Array<{ row: number; error: string }>;
}

/**
 * Validate email format using RFC 5322 simplified pattern.
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
 * Fetch all existing user emails from Supabase Auth.
 * Handles pagination to support more than 1000 users.
 * Returns null if the admin API is not available (graceful degradation).
 */
async function fetchExistingUserEmails(): Promise<Set<string> | null> {
  const supabase = getSupabase();

  // Check if admin API is available
  if (!supabase.auth.admin) {
    console.warn('[bulk-upload] Supabase auth.admin API not available - user deduplication disabled');
    return null;
  }

  const emails = new Set<string>();
  let page = 1;
  const perPage = 1000;

  try {
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error(`[bulk-upload] Error listing users (page ${page}): ${error.message}`);
        throw error;
      }
      for (const u of data.users) {
        if (u.email) emails.add(u.email.toLowerCase());
      }
      if (data.users.length < perPage) break;
      page++;
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[bulk-upload] Failed to fetch existing users: ${errMsg}`);
    // Return null on failure to indicate the admin API is not working
    return null;
  }

  return emails;
}

/**
 * Create a new user in Supabase Auth with default password '123456'.
 */
async function createUser(email: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.admin.createUser({
    email,
    password: '123456',
    email_confirm: true,
  });
  if (error) {
    console.error(`[bulk-upload] Error creating user for ${email}: ${error.message}`);
    throw error;
  }
}

/**
 * Build a CardRequest from parsed CSV columns.
 */
function buildCardRequest(columns: string[], createdBy: string): CardRequest {
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
    createdBy,
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
      autoRegistered: 0,
      errors: [],
    };

    // Fetch existing user emails once before processing rows
    let existingEmails: Set<string> | null;
    try {
      existingEmails = await fetchExistingUserEmails();
    } catch {
      existingEmails = null;
      console.error('[bulk-upload] Failed to fetch existing users, all emails will attempt creation');
    }

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

        // Determine createdBy based on email column
        const email = columns[7]?.trim() || '';
        let createdBy = 'admin-bulk-upload';

        if (email && isValidEmail(email)) {
          const emailLower = email.toLowerCase();
          try {
            // Only attempt to auto-register if we have access to existing emails list
            if (existingEmails) {
              if (!existingEmails.has(emailLower)) {
                await createUser(emailLower);
                existingEmails.add(emailLower);
                result.autoRegistered++;
                console.log(`[bulk-upload] Row ${rowNumber}: Auto-registered user ${emailLower}`);
              } else {
                console.log(`[bulk-upload] Row ${rowNumber}: User ${emailLower} already exists`);
              }
            } else {
              // Admin API not available, attempt to create anyway
              try {
                await createUser(emailLower);
                result.autoRegistered++;
                console.log(`[bulk-upload] Row ${rowNumber}: Auto-registered user ${emailLower} (no deduplication)`);
              } catch (createErr) {
                const createErrMsg = createErr instanceof Error ? createErr.message : String(createErr);
                // If creation fails when admin API is down, log but continue
                console.warn(
                  `[bulk-upload] Row ${rowNumber}: Could not create user ${emailLower}: ${createErrMsg}`
                );
              }
            }
            createdBy = email;
          } catch (authErr) {
            // If user creation fails, log the error but still set createdBy to email for tracking
            const errorMsg = authErr instanceof Error ? authErr.message : String(authErr);
            console.error(
              `[bulk-upload] Row ${rowNumber}: Failed to create user for ${email}. Will use email as createdBy anyway. Error: ${errorMsg}`
            );
            // Still set createdBy to email even if creation fails - this preserves the user's email
            // and helps track which rows had auto-registration issues
            createdBy = email;
          }
        } else if (email && !isValidEmail(email)) {
          // Log invalid email format but still try to save the card with the invalid email
          console.warn(
            `[bulk-upload] Row ${rowNumber}: Invalid email format: "${email}". Using as-is for createdBy.`
          );
          createdBy = email;
        }

        const cardRequest = buildCardRequest(columns, createdBy);
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
