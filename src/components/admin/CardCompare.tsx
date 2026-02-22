'use client';

import { useState } from 'react';

/**
 * Convert Google Drive sharing URLs to direct image URLs.
 */
function convertGoogleDriveUrl(url: string): string {
  if (!url) return url;

  let match = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;

  match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;

  match = url.match(/docs\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;

  return url;
}

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
  const transformedAvatarUrl = originalAvatarUrl ? convertGoogleDriveUrl(originalAvatarUrl) : null;
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [illustrationLoadError, setIllustrationLoadError] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Original avatar */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2 text-center">
            원본 사진
          </p>
          <div className="aspect-[29/45] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
            {transformedAvatarUrl ? (
              avatarLoadError ? (
                <div className="text-center px-2">
                  <p className="text-xs text-red-500 font-medium mb-1">이미지 로드 실패</p>
                  <p className="text-xs text-gray-400 break-all">{originalAvatarUrl}</p>
                </div>
              ) : (
                <img
                  src={transformedAvatarUrl}
                  alt="Original avatar"
                  className="w-full h-full object-cover"
                  onError={() => setAvatarLoadError(true)}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
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
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
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

      {/* Debug info toggle and display */}
      <div className="border-t border-gray-200 pt-3">
        <button
          type="button"
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium"
        >
          {showDebugInfo ? '▼' : '▶'} 디버그 정보
        </button>
        {showDebugInfo && (
          <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 text-xs space-y-2">
            <div>
              <p className="text-gray-600 font-medium">원본 사진 URL:</p>
              {originalAvatarUrl ? (
                <p className="text-gray-700 break-all font-mono">{originalAvatarUrl}</p>
              ) : (
                <p className="text-gray-400">없음</p>
              )}
            </div>
            <div>
              <p className="text-gray-600 font-medium">일러스트 URL:</p>
              {illustrationSrc ? (
                <p className="text-gray-700 break-all font-mono">{illustrationSrc}</p>
              ) : (
                <p className="text-gray-400">없음</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
