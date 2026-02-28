import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth-utils';
import { getSupabase } from '@/lib/supabase';
import { updateProfile } from '@/lib/profile-storage';

/** Allowed MIME types for avatar uploads. */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Maximum file size in bytes (5 MB). */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Validate image file by checking magic bytes (file signature). */
function validateImageMagicBytes(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 12));
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  // WebP: RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;
  return false;
}

/** Map MIME type to file extension. */
function getExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'png';
  }
}

/**
 * POST /api/profiles/me/avatar
 * Upload a profile avatar image.
 *
 * Accepts multipart/form-data with a "file" field.
 * Validates file type (jpeg/png/webp) and size (max 5 MB).
 * Uploads to Supabase Storage bucket "avatars" at "profiles/{userId}/avatar.{ext}".
 * Updates user_profiles.avatar_url with the public URL.
 *
 * Returns { avatarUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided. Use field name "file".' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: jpeg, png, webp.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5 MB.' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const ext = getExtension(file.type);
    const filePath = `profiles/${user.id}/avatar.${ext}`;

    // Convert File to Uint8Array for Supabase upload
    const arrayBuffer = await file.arrayBuffer();

    // Validate magic bytes to prevent MIME type spoofing
    if (!validateImageMagicBytes(arrayBuffer)) {
      return NextResponse.json(
        { error: 'Invalid image file. File content does not match declared type.' },
        { status: 400 }
      );
    }

    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage (upsert replaces existing file)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError.message);
      return NextResponse.json(
        { error: 'Failed to upload avatar.' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // Update profile with new avatar URL
    await updateProfile(user.id, { avatarUrl });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profiles/me/avatar
 * Remove the current user's profile avatar.
 *
 * Removes the avatar file from Supabase Storage.
 * Sets user_profiles.avatar_url to null.
 *
 * Returns { success: true }
 */
export async function DELETE() {
  try {
    const user = await requireAuth();

    const supabase = getSupabase();

    // Remove all possible avatar files (jpg, png, webp)
    // Since we don't know which extension was used, try removing all
    const filesToRemove = [
      `profiles/${user.id}/avatar.jpg`,
      `profiles/${user.id}/avatar.png`,
      `profiles/${user.id}/avatar.webp`,
    ];

    await supabase.storage.from('avatars').remove(filesToRemove);

    // Set avatar_url to null in the profile
    await updateProfile(user.id, { avatarUrl: null });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
