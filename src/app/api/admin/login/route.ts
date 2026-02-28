import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    const ADMIN_TOKEN_VALUE = process.env.ADMIN_TOKEN_VALUE;

    // Reject login entirely if env vars are not configured
    if (!ADMIN_PASSWORD || !ADMIN_TOKEN_VALUE) {
      console.error('[admin-login] ADMIN_PASSWORD or ADMIN_TOKEN_VALUE environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true }, { status: 200 });

    response.cookies.set('admin-token', ADMIN_TOKEN_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
