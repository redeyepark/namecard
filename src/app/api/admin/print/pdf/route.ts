import { NextRequest, NextResponse } from 'next/server';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';
import { getSupabase } from '@/lib/supabase';

/**
 * POST: Upload a Gelato-compatible PDF to Supabase Storage.
 *
 * Request: FormData with fields:
 *   - file: PDF blob
 *   - cardId: string (card request ID)
 *   - side: 'front' | 'back'
 *
 * Response: { url: string } (public URL of the uploaded PDF)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminToken();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const cardId = formData.get('cardId') as string | null;
    const side = formData.get('side') as string | null;

    if (!file || !cardId || !side || !['front', 'back'].includes(side)) {
      return NextResponse.json(
        { error: 'Missing required fields: file, cardId, side' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const filePath = `${cardId}/${side}.pdf`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('print-pdfs')
      .upload(filePath, new Uint8Array(arrayBuffer), {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from('print-pdfs')
      .getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl });
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
