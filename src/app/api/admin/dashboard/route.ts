import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/storage';
import { requireAdminToken, AuthError } from '@/lib/auth-utils';

export async function GET() {
  try {
    await requireAdminToken();

    const stats = await getDashboardStats();
    return NextResponse.json({ stats });
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
