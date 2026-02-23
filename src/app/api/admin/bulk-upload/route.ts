import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase } from '@/lib/supabase';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import { convertGoogleDriveUrl } from '@/lib/url-utils';
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
 * Extract a clean username/handle from a social media URL or value.
 * Examples:
 *   "https://www.instagram.com/wonder_choi/" -> "wonder_choi"
 *   "https://www.linkedin.com/in/choi-wonjoon-4176a23/" -> "choi-wonjoon-4176a23"
 *   "www.linkedin.com/in/aleckim78" -> "aleckim78"
 *   "linkedin.com/in/yannheo" -> "yannheo"
 *   "blog.naver.com/ggetmam" -> "ggetmam"
 *   "@yannheo" -> "@yannheo"
 *   "wonder.choi" -> "wonder.choi"
 */
function extractSocialHandle(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  // If it looks like a URL (starts with http/www, or has domain.tld/ pattern)
  // try to extract the last meaningful path segment
  if (/^(https?:\/\/|www\.)/.test(trimmed) || /[a-zA-Z]\.[a-zA-Z].*\//.test(trimmed)) {
    try {
      // Normalize: add protocol if missing so URL parsing works
      let urlStr = trimmed;
      if (!/^https?:\/\//.test(urlStr)) {
        urlStr = 'https://' + urlStr;
      }
      const url = new URL(urlStr);
      // Get pathname segments, filter out empty strings
      const segments = url.pathname.split('/').filter((s) => s.length > 0);
      if (segments.length > 0) {
        // Return the last non-empty segment (e.g. "in/username" -> "username")
        const handle = segments[segments.length - 1];
        // Remove trailing slashes (already handled by split, but just in case)
        return handle.replace(/\/+$/, '');
      }
    } catch {
      // URL parsing failed, fall through to return trimmed value
    }
  }

  // Not a URL - return as-is (handles @mentions, plain usernames, etc.)
  return trimmed;
}

/**
 * Check if a row is entirely empty (all columns are blank).
 */
function isEmptyRow(columns: string[]): boolean {
  return columns.every((col) => col.trim() === '');
}

/**
 * Fetch all existing user emails from Supabase Auth via REST API.
 * Uses direct fetch() instead of Supabase SDK admin methods for
 * Cloudflare Workers edge runtime compatibility.
 * Handles pagination to support more than 1000 users.
 * Returns null if the admin API is not available (graceful degradation).
 */
async function fetchExistingUserEmails(): Promise<Set<string> | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[bulk-upload] Missing Supabase URL or service role key');
    return null;
  }

  const emails = new Set<string>();
  let page = 1;
  const perPage = 1000;

  try {
    while (true) {
      const response = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[bulk-upload] Error listing users (page ${page}): ${response.status} ${errorText}`);
        return null;
      }

      const data = await response.json();
      const users = data.users || [];

      for (const u of users) {
        if (u.email) emails.add(u.email.toLowerCase());
      }

      if (users.length < perPage) break;
      page++;
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[bulk-upload] Failed to fetch existing users: ${errMsg}`);
    return null;
  }

  return emails;
}

/**
 * Create a new user in Supabase Auth with default password '123456'.
 * Uses direct fetch() instead of Supabase SDK admin methods for
 * Cloudflare Workers edge runtime compatibility.
 */
async function createUser(email: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or service role key');
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password: '123456',
      email_confirm: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.message || errorData.msg || `HTTP ${response.status}`;
    console.error(`[bulk-upload] Error creating user for ${email}: ${errorMsg}`);
    throw new Error(errorMsg);
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
      label: extractSocialHandle(facebook.trim()),
    });
  }

  if (instagram && instagram.trim()) {
    socialLinks.push({
      platform: 'instagram',
      url: instagram.trim(),
      label: extractSocialHandle(instagram.trim()),
    });
  }

  if (linkedin && linkedin.trim()) {
    socialLinks.push({
      platform: 'linkedin',
      url: linkedin.trim(),
      label: extractSocialHandle(linkedin.trim()),
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
        textColor: '#FFFFFF',
      },
      back: {
        fullName: (backName || '').trim(),
        title: (interest || '').trim(),
        hashtags,
        socialLinks,
        backgroundColor,
        textColor: '#000000',
      },
    },
    originalAvatarPath: photoUrl && photoUrl.trim() ? (convertGoogleDriveUrl(photoUrl.trim()) as string) : null,
    illustrationPath: null,
    status: 'processing',
    submittedAt: now,
    updatedAt: now,
    createdBy,
    statusHistory: [
      { status: 'submitted', timestamp: now },
      { status: 'processing', timestamp: now },
    ],
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

    // =========================================================================
    // Phase 1: Parse and validate all CSV rows (synchronous, fast)
    // =========================================================================
    interface ValidRow {
      rowNumber: number;
      columns: string[];
      email: string;
      createdBy: string;
    }

    const validRows: ValidRow[] = [];

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
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: `Expected 12 columns but got ${columns.length}`,
          });
          continue;
        }

        // Validate required field: displayName (column 2)
        const frontName = columns[1]?.trim();
        if (!frontName) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: 'displayName (column 2) is required',
          });
          continue;
        }

        const email = columns[7]?.trim() || '';
        validRows.push({ rowNumber, columns, email, createdBy: 'admin-bulk-upload' });
      } catch (err) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // =========================================================================
    // Phase 2: Handle user creation for valid rows (sequential, before batch)
    // =========================================================================
    for (const row of validRows) {
      const { email, rowNumber } = row;

      if (email && isValidEmail(email)) {
        const emailLower = email.toLowerCase();
        try {
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
              console.warn(
                `[bulk-upload] Row ${rowNumber}: Could not create user ${emailLower}: ${createErrMsg}`
              );
            }
          }
          row.createdBy = email;
        } catch (authErr) {
          const errorMsg = authErr instanceof Error ? authErr.message : String(authErr);
          console.error(
            `[bulk-upload] Row ${rowNumber}: Failed to create user for ${email}. Will use email as createdBy anyway. Error: ${errorMsg}`
          );
          row.createdBy = email;
        }
      } else if (email && !isValidEmail(email)) {
        console.warn(
          `[bulk-upload] Row ${rowNumber}: Invalid email format: "${email}". Using as-is for createdBy.`
        );
        row.createdBy = email;
      }
    }

    // =========================================================================
    // Phase 3: Build card requests and batch insert (1-2 API calls total)
    // =========================================================================
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cardDbRows: Array<Record<string, any>> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const historyDbRows: Array<Record<string, any>> = [];
    const rowIndexMap: Map<number, ValidRow> = new Map();

    for (let idx = 0; idx < validRows.length; idx++) {
      const row = validRows[idx];
      try {
        const cardRequest = buildCardRequest(row.columns, row.createdBy);

        // Strip avatarImage from card.front (same as saveRequest in storage.ts)
        const { avatarImage: _avatarImage, ...cardFrontWithoutAvatar } = cardRequest.card.front;

        cardDbRows.push({
          id: cardRequest.id,
          card_front: cardFrontWithoutAvatar,
          card_back: cardRequest.card.back,
          original_avatar_url: cardRequest.originalAvatarPath,
          illustration_url: cardRequest.illustrationPath,
          status: cardRequest.status,
          submitted_at: cardRequest.submittedAt,
          updated_at: cardRequest.updatedAt,
          note: cardRequest.note || null,
          created_by: cardRequest.createdBy || null,
        });

        for (const entry of cardRequest.statusHistory) {
          historyDbRows.push({
            request_id: cardRequest.id,
            status: entry.status,
            created_at: entry.timestamp,
            admin_feedback: entry.adminFeedback || null,
          });
        }

        rowIndexMap.set(cardDbRows.length - 1, row);
      } catch (err) {
        result.failed++;
        result.errors.push({
          row: row.rowNumber,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Batch insert card_requests
    if (cardDbRows.length > 0) {
      const supabase = getSupabase();

      const { error: batchCardError } = await supabase
        .from('card_requests')
        .insert(cardDbRows);

      if (batchCardError) {
        console.error(
          `[bulk-upload] Batch card_requests insert failed: ${batchCardError.message}. Falling back to individual inserts.`
        );

        // Fallback: insert individually to identify which rows fail
        for (let idx = 0; idx < cardDbRows.length; idx++) {
          const cardRow = cardDbRows[idx];
          const validRow = rowIndexMap.get(idx);

          const { error: individualError } = await supabase
            .from('card_requests')
            .insert(cardRow);

          if (individualError) {
            result.failed++;
            result.errors.push({
              row: validRow?.rowNumber ?? -1,
              error: `Failed to save request: ${individualError.message}`,
            });
          } else {
            result.success++;
          }
        }

        // For fallback path, also insert history rows individually per request
        for (const historyRow of historyDbRows) {
          await supabase
            .from('card_request_status_history')
            .insert(historyRow);
        }
      } else {
        // Batch card insert succeeded, now batch insert status history
        result.success = cardDbRows.length;

        if (historyDbRows.length > 0) {
          const { error: batchHistoryError } = await supabase
            .from('card_request_status_history')
            .insert(historyDbRows);

          if (batchHistoryError) {
            // History insert failure is non-fatal; cards were saved
            console.error(
              `[bulk-upload] Batch status_history insert failed: ${batchHistoryError.message}. Attempting individual inserts.`
            );

            for (const historyRow of historyDbRows) {
              const { error: histErr } = await supabase
                .from('card_request_status_history')
                .insert(historyRow);

              if (histErr) {
                console.warn(
                  `[bulk-upload] Failed to insert status history for request ${historyRow.request_id}: ${histErr.message}`
                );
              }
            }
          }
        }
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
