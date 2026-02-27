'use client';

import { useState, useCallback } from 'react';
import type { UserProfile } from '@/types/profile';

interface ProfileEditFormProps {
  profile: UserProfile;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
}

/**
 * Profile edit form with display name, bio, avatar upload, and public toggle.
 * Used in dashboard settings page.
 */
export function ProfileEditForm({ profile, onSave }: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [isPublic, setIsPublic] = useState(profile.isPublic);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const bioMaxLength = 200;

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
        });
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : '프로필 저장에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [displayName, bio, isPublic, onSave],
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
