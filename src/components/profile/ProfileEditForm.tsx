'use client';

import { useState, useCallback, useRef } from 'react';
import type { UserProfile } from '@/types/profile';
import { validateImageFile } from '@/lib/validation';
import { convertGoogleDriveUrl } from '@/lib/url-utils';

interface ProfileEditFormProps {
  profile: UserProfile;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
}

/**
 * Get initials from a display name for avatar placeholder.
 */
function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

/**
 * Profile edit form with display name, bio, avatar upload, and public toggle.
 * Used in dashboard settings page.
 */
export function ProfileEditForm({ profile, onSave }: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [isPublic, setIsPublic] = useState(profile.isPublic);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bioMaxLength = 200;

  const resolvedAvatarSrc = avatarUrl
    ? convertGoogleDriveUrl(avatarUrl) || avatarUrl
    : null;

  const handleAvatarClick = () => {
    if (!isAvatarUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so the same file can be selected again
    e.target.value = '';

    // Client-side validation
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAvatarError(validation.error || '파일 검증에 실패했습니다.');
      return;
    }

    setAvatarError(null);
    setIsAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profiles/me/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '아바타 업로드에 실패했습니다.');
      }

      const data = await res.json();
      setAvatarUrl(data.avatarUrl);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : '아바타 업로드에 실패했습니다.');
    } finally {
      setIsAvatarUploading(false);
    }
  }, []);

  const handleAvatarDelete = useCallback(async () => {
    setAvatarError(null);
    setIsAvatarUploading(true);

    try {
      const res = await fetch('/api/profiles/me/avatar', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '아바타 삭제에 실패했습니다.');
      }

      setAvatarUrl(null);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : '아바타 삭제에 실패했습니다.');
    } finally {
      setIsAvatarUploading(false);
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);

      // Validate
      if (!displayName.trim()) {
        setError('표시 이름은 필수입니다.');
        return;
      }
      if (displayName.length > 100) {
        setError('표시 이름은 100자 이하여야 합니다.');
        return;
      }
      if (bio.length > bioMaxLength) {
        setError(`소개는 ${bioMaxLength}자 이하여야 합니다.`);
        return;
      }

      setIsLoading(true);
      try {
        await onSave({
          displayName: displayName.trim(),
          bio,
          isPublic,
          avatarUrl,
        });
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : '프로필 저장에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [displayName, bio, isPublic, avatarUrl, onSave],
  );

  return (
    <div className="bg-white border border-[rgba(2,9,18,0.15)] p-8">
      {/* Success message */}
      {success && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200" role="status">
          <p className="text-sm text-green-700">프로필이 성공적으로 저장되었습니다.</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar upload section */}
        <div className="flex flex-col items-center mb-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
            aria-label="프로필 사진 선택"
          />

          {/* Avatar preview */}
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={isAvatarUploading}
            className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[rgba(2,9,18,0.15)] hover:border-[#020912]/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#020912]/30 disabled:opacity-50 group"
            aria-label={resolvedAvatarSrc ? '프로필 사진 변경' : '프로필 사진 추가'}
          >
            {isAvatarUploading ? (
              <div className="w-full h-full bg-[#fcfcfc] flex items-center justify-center">
                <svg className="w-6 h-6 animate-spin text-[#020912]/50" fill="none" viewBox="0 0 24 24">
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
            ) : resolvedAvatarSrc ? (
              <>
                <img
                  src={resolvedAvatarSrc}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-[#fcfcfc] flex flex-col items-center justify-center text-[#020912]/30 group-hover:text-[#020912]/50 transition-colors duration-200">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
          </button>

          {/* Avatar action buttons */}
          <div className="flex items-center gap-3 mt-2">
            {resolvedAvatarSrc ? (
              <>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isAvatarUploading}
                  className="text-xs text-[#020912]/60 hover:text-[#020912] disabled:opacity-50 transition-colors duration-200"
                >
                  변경
                </button>
                <span className="text-xs text-[#020912]/20">|</span>
                <button
                  type="button"
                  onClick={handleAvatarDelete}
                  disabled={isAvatarUploading}
                  className="text-xs text-red-500/70 hover:text-red-600 disabled:opacity-50 transition-colors duration-200"
                >
                  삭제
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isAvatarUploading}
                className="text-xs text-[#020912]/60 hover:text-[#020912] disabled:opacity-50 transition-colors duration-200"
              >
                사진 추가
              </button>
            )}
          </div>

          {/* Avatar error message */}
          {avatarError && (
            <p className="text-xs text-red-500 mt-1.5 text-center max-w-[240px]" role="alert">
              {avatarError}
            </p>
          )}
        </div>

        {/* Display name */}
        <div>
          <label
            htmlFor="profileDisplayName"
            className="block text-sm font-medium text-[#020912]/70 mb-1"
          >
            표시 이름
          </label>
          <input
            id="profileDisplayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="이름을 입력하세요"
            required
            maxLength={100}
            disabled={isLoading}
            className="w-full px-4 py-2.5 bg-[#fcfcfc] border border-[rgba(2,9,18,0.15)] text-sm text-[#020912] placeholder:text-[#020912]/30 focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-transparent disabled:opacity-50 transition-all duration-200"
          />
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="profileBio"
            className="block text-sm font-medium text-[#020912]/70 mb-1"
          >
            소개
          </label>
          <textarea
            id="profileBio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="간단한 소개를 입력하세요"
            maxLength={bioMaxLength}
            rows={3}
            disabled={isLoading}
            className="w-full px-4 py-2.5 bg-[#fcfcfc] border border-[rgba(2,9,18,0.15)] text-sm text-[#020912] placeholder:text-[#020912]/30 focus:outline-none focus:ring-2 focus:ring-[#020912]/30 focus:border-transparent disabled:opacity-50 transition-all duration-200 resize-none"
          />
          <div className="flex justify-end mt-1">
            <span
              className={`text-xs ${
                bio.length > bioMaxLength ? 'text-red-500' : 'text-[#020912]/40'
              }`}
            >
              {bio.length}/{bioMaxLength}
            </span>
          </div>
        </div>

        {/* Public toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-sm font-medium text-[#020912]/70">
              프로필 공개
            </span>
            <p className="text-xs text-[#020912]/40 mt-0.5">
              다른 사용자가 내 프로필과 카드를 볼 수 있습니다
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            onClick={() => setIsPublic(!isPublic)}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 items-center transition-colors duration-200 disabled:opacity-50 ${
              isPublic ? 'bg-[#020912]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform bg-white transition-transform duration-200 ${
                isPublic ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-[#020912] text-[#fcfcfc] text-sm font-semibold hover:bg-[#020912]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
              저장 중...
            </span>
          ) : (
            '프로필 저장'
          )}
        </button>
      </form>
    </div>
  );
}
