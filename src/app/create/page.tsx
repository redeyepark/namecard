'use client';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { WizardContainer } from '@/components/wizard/WizardContainer';
import { UserMenu } from '@/components/auth/UserMenu';
import { useAuth } from '@/components/auth/AuthProvider';

export default function CreatePage() {
  // TEMPORARY: Card creation is temporarily disabled. Remove this line to re-enable.
  redirect('/dashboard');

  const { user } = useAuth();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
      <div className="max-w-4xl mx-auto">
        {/* Header with navigation and user info */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              홈으로
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              명함 만들기
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user?.name && (
              <span className="hidden sm:inline text-sm text-gray-500">
                안녕하세요, <span className="font-medium text-gray-700">{user?.name}</span>님
              </span>
            )}
            <UserMenu />
          </div>
        </div>

        <WizardContainer />
      </div>
    </main>
  );
}
