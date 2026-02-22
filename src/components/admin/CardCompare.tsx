'use client';

import { useState } from 'react';

interface CardCompareProps {
  originalAvatarUrl: string | null;
  illustrationUrl: string | null;
  illustrationPreview: string | null; // Local preview before saving
}

export function CardCompare({
  originalAvatarUrl,
  illustrationUrl,
  illustrationPreview,
}: CardCompareProps) {
  const illustrationSrc = illustrationPreview || illustrationUrl;
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [illustrationLoadError, setIllustrationLoadError] = useState(false);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Original avatar */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 text-center">
          원본 사진
        </p>
        <div className="aspect-[29/45] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
          {originalAvatarUrl ? (
            avatarLoadError ? (
              <div className="text-center px-2">
                <p className="text-xs text-red-500 font-medium mb-1">이미지 로드 실패</p>
                <p className="text-xs text-gray-400 break-all">{originalAvatarUrl}</p>
              </div>
            ) : (
              <img
                src={originalAvatarUrl}
                alt="Original avatar"
                className="w-full h-full object-cover"
                onError={() => setAvatarLoadError(true)}
              />
            )
          ) : (
            <p className="text-xs text-gray-400 text-center px-2">
              업로드된 사진 없음
            </p>
          )}
        </div>
      </div>

      {/* Illustration */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 text-center">
          일러스트
        </p>
        <div className="aspect-[29/45] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
          {illustrationSrc ? (
            illustrationLoadError ? (
              <div className="text-center px-2">
                <p className="text-xs text-red-500 font-medium mb-1">이미지 로드 실패</p>
                <p className="text-xs text-gray-400 break-all">{illustrationSrc}</p>
              </div>
            ) : (
              <img
                src={illustrationSrc}
                alt="Illustration"
                className="w-full h-full object-cover"
                onError={() => setIllustrationLoadError(true)}
              />
            )
          ) : (
            <p className="text-xs text-gray-400 text-center px-2">
              아직 없음
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
