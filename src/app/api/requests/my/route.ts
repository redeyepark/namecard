import { NextResponse } from 'next/server';
import { getRequestsByUser } from '@/lib/storage';
import { requireAuth, AuthError } from '@/lib/auth-utils';

export async function GET() {
  try {
    const user = await requireAuth();

    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    const requests = await getRequestsByUser(user.email);

    return NextResponse.json({
      requests,
      total: requests.length,
    });
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
