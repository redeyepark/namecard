'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-auth';

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    // Supabase automatically handles the token from the URL hash fragment
    // and establishes a session. We listen for the PASSWORD_RECOVERY event.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsSessionReady(true);
      }
    });

    // Also check if session already exists (e.g., page reload after token exchange)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsSessionReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.replace('/login');
        }, 3000);
      }
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] px-4">
      {/* Back to login */}
      <div className="w-full max-w-sm mb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-[#020912]/60 hover:text-[#ffa639] transition-colors"
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

      {/* Reset confirm card */}
      <div className="w-full max-w-sm bg-white border border-[rgba(2,9,18,0.15)] p-8">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#020912] mb-4">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#020912]">
            새 비밀번호 설정
          </h1>
          <p className="mt-2 text-sm text-[#020912]/50">
            새로운 비밀번호를 입력해주세요
          </p>
        </div>

        {/* Success message */}
        {success ? (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#dbe9e0] mb-2">
              <svg
                className="w-8 h-8 text-[#020912]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-base font-medium text-[#020912]">
              비밀번호가 성공적으로 변경되었습니다.
            </p>
            <p className="text-sm text-[#020912]/50">
              잠시 후 로그인 페이지로 이동합니다...
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-[#020912] hover:text-[#ffa639] transition-colors"
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
        ) : !isSessionReady ? (
          // Loading state while waiting for session
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <svg
                className="w-8 h-8 animate-spin text-[#020912]/30"
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
            </div>
            <p className="text-sm text-[#020912]/50">
              인증 정보를 확인하고 있습니다...
            </p>
          </div>
        ) : (
          <>
            {/* Error message */}
            {error && (
              <div
                className="mb-6 p-3 bg-red-50 border border-red-200"
                role="alert"
              >
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* New password form */}
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#020912]/70 mb-1"
                >
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="최소 6자 이상"
                    required
                    minLength={6}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 pr-10 bg-[#fcfcfc] border border-[rgba(2,9,18,0.15)] text-sm text-[#020912] placeholder:text-[#020912]/30 focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-transparent disabled:opacity-50 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#020912]/40 hover:text-[#020912]/70 transition-colors"
                    aria-label={
                      showPassword ? '비밀번호 숨기기' : '비밀번호 보기'
                    }
                  >
                    {showPassword ? (
                      <svg
                        className="w-4.5 h-4.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4.5 h-4.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-[#020912]/70 mb-1"
                >
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-[#fcfcfc] border border-[rgba(2,9,18,0.15)] text-sm text-[#020912] placeholder:text-[#020912]/30 focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-transparent disabled:opacity-50 transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#020912] text-[#fcfcfc] text-sm font-semibold hover:bg-[#020912]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                    변경 중...
                  </span>
                ) : (
                  '비밀번호 변경'
                )}
              </button>
            </form>
          </>
        )}

        {/* Terms */}
        <div className="mt-6 pt-6 border-t border-[rgba(2,9,18,0.08)] text-center">
          <p className="text-xs text-[#020912]/30">Namecard Editor</p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-[#020912]/30">Namecard Editor</p>
    </div>
  );
}
