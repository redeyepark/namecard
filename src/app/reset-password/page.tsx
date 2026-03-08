'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-auth';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password/confirm`,
        }
      );

      if (authError) {
        setError(authError.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary px-4">
      {/* Back to login */}
      <div className="w-full max-w-sm mb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-primary/60 hover:text-accent-orange transition-colors"
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
          로그인으로 돌아가기
        </Link>
      </div>

      {/* Reset password card */}
      <div className="w-full max-w-sm bg-surface border border-border-medium p-8">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary mb-4">
            <svg
              className="w-7 h-7 text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-primary">
            비밀번호 찾기
          </h1>
          <p className="mt-2 text-sm text-primary/50">
            가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다
          </p>
        </div>

        {/* Success message */}
        {success ? (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-green mb-2">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <p className="text-base font-medium text-primary">
              비밀번호 재설정 링크가 이메일로 전송되었습니다.
            </p>
            <p className="text-sm text-primary/50">
              이메일을 확인하고 링크를 클릭해주세요.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary hover:text-accent-orange transition-colors"
            >
              로그인 페이지로 이동
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
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        ) : (
          <>
            {/* Error message */}
            {error && (
              <div
                className="mb-6 p-3 bg-error/10 border border-error/20"
                role="alert"
              >
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Email form */}
            <form onSubmit={handleResetRequest} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-primary/70 mb-1"
                >
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-secondary border border-border-medium text-sm text-primary placeholder:text-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus:border-transparent disabled:opacity-50 transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary text-secondary text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    전송 중...
                  </span>
                ) : (
                  '재설정 링크 보내기'
                )}
              </button>
            </form>

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-primary/50">
                비밀번호가 기억나셨나요?{' '}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:text-accent-orange transition-colors"
                >
                  로그인
                </Link>
              </p>
            </div>
          </>
        )}

        {/* Terms */}
        <div className="mt-6 pt-6 border-t border-divider text-center">
          <p className="text-xs text-primary/30">Namecard Editor</p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-primary/30">Namecard Editor</p>
    </div>
  );
}
