'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase-auth';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import type { UserProfile } from '@/types/profile';

export default function SettingsPage() {
  const { user, session, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?callbackUrl=/dashboard/settings');
    }
  }, [authLoading, user, router]);

  // Fetch profile data
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const res = await fetch(`/api/profiles/me`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        } else if (res.status === 404) {
          // Profile doesn't exist yet - set defaults
          setProfile({
            id: user.id,
            displayName: user.name || user.email.split('@')[0],
            bio: '',
            avatarUrl: null,
            isPublic: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          setProfileError('프로필을 불러오는데 실패했습니다.');
        }
      } catch {
        setProfileError('프로필을 불러오는데 실패했습니다.');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Save profile handler
  const handleProfileSave = useCallback(
    async (data: Partial<UserProfile>) => {
      const res = await fetch('/api/profiles/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || '프로필 저장에 실패했습니다.');
      }

      const updated = await res.json();
      setProfile(updated.profile);
    },
    [],
  );

  const isEmailProvider =
    session?.user?.app_metadata?.provider === 'email';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side validation
    if (newPassword.length < 6) {
      setError('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email,
        password: currentPassword,
      });

      if (signInError) {
        setError('현재 비밀번호가 올바르지 않습니다.');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg
          className="animate-spin h-6 w-6 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#020912]">설정</h1>
          <p className="mt-1 text-sm text-[#020912]/50">
            프로필과 계정을 관리합니다.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#020912] bg-[#e4f6ff] hover:bg-[#e4f6ff]/70 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          홈으로 돌아가기
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-md space-y-8">
        {/* Profile Edit Section */}
        <section>
          <h2 className="text-lg font-bold text-[#020912] mb-3">프로필 편집</h2>
          {profileLoading ? (
            <div className="bg-white border border-[rgba(2,9,18,0.15)] p-8 flex justify-center">
              <svg
                className="animate-spin h-6 w-6 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : profileError ? (
            <div className="bg-white border border-[rgba(2,9,18,0.15)] p-8">
              <p className="text-sm text-red-600">{profileError}</p>
            </div>
          ) : profile ? (
            <ProfileEditForm profile={profile} onSave={handleProfileSave} />
          ) : null}
        </section>

        {/* Password Change Section */}
        <section>
          <h2 className="text-lg font-bold text-[#020912] mb-3">비밀번호 변경</h2>
          {!isEmailProvider ? (
            /* Social login message */
            <div className="bg-white border border-[rgba(2,9,18,0.15)] p-8">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-[#ffa639] mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <p className="text-sm text-[#020912]/70 leading-relaxed">
                  소셜 로그인(Google) 계정은 비밀번호를 변경할 수 없습니다.
                  Google 계정 설정에서 비밀번호를 관리해주세요.
                </p>
              </div>
            </div>
          ) : (
            /* Password change form */
            <div className="bg-white border border-[rgba(2,9,18,0.15)] p-8">
              {/* Success message */}
              {success && (
                <div
                  className="mb-6 p-3 bg-green-50 border border-green-200"
                  role="status"
                >
                  <p className="text-sm text-green-700">
                    비밀번호가 성공적으로 변경되었습니다.
                  </p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div
                  className="mb-6 p-3 bg-red-50 border border-red-200"
                  role="alert"
                >
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current password */}
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-[#020912]/70 mb-1"
                  >
                    현재 비밀번호
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="현재 비밀번호를 입력하세요"
                      required
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 pr-10 bg-[#fcfcfc] border border-[rgba(2,9,18,0.15)] text-sm text-[#020912] placeholder:text-[#020912]/30 focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-transparent disabled:opacity-50 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#020912]/40 hover:text-[#020912]/70 transition-colors"
                      aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
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

                {/* New password */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-[#020912]/70 mb-1"
                  >
                    새 비밀번호
                  </label>
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="최소 6자 이상"
                    required
                    minLength={6}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-[#fcfcfc] border border-[rgba(2,9,18,0.15)] text-sm text-[#020912] placeholder:text-[#020912]/30 focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-transparent disabled:opacity-50 transition-all duration-200"
                  />
                </div>

                {/* Confirm new password */}
                <div>
                  <label
                    htmlFor="confirmNewPassword"
                    className="block text-sm font-medium text-[#020912]/70 mb-1"
                  >
                    새 비밀번호 확인
                  </label>
                  <input
                    id="confirmNewPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    required
                    minLength={6}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-[#fcfcfc] border border-[rgba(2,9,18,0.15)] text-sm text-[#020912] placeholder:text-[#020912]/30 focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-transparent disabled:opacity-50 transition-all duration-200"
                  />
                </div>

                {/* Submit button */}
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
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
